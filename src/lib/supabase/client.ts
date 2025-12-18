import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { sessionStorage } from '@/lib/auth/sessionStorage'

// Singleton instance
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null
let isRestoringSession = false
let restorationPromise: Promise<void> | null = null

// Global restoration state tracking
let restorationComplete = false
let restorationSuccess = false
const restorationListeners: Array<(success: boolean) => void> = []

export function createClient() {
  // Only create client in browser environment
  if (typeof window === 'undefined') {
    // During SSR/build, return a dummy that will be replaced on client
    // This prevents build errors while allowing static generation
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
    )
  }

  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  // Get and validate environment variables at runtime (client-side only)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  // Debug logging
  console.log('[Supabase] Initializing client...')
  console.log('[Supabase] URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET')
  console.log('[Supabase] Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}... (length: ${supabaseAnonKey.length})` : 'NOT SET')

  if (!supabaseUrl || !supabaseAnonKey) {
    const msg = `Supabase config missing - URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`
    console.error('[Supabase]', msg)
    throw new Error(msg)
  }

  // Validate URL format
  if (!supabaseUrl.includes('supabase.co')) {
    console.error('[Supabase] Invalid URL:', supabaseUrl)
    throw new Error(`Invalid Supabase URL: ${supabaseUrl}`)
  }

  // Validate key format (should be a JWT)
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.error('[Supabase] Invalid key format, starts with:', supabaseAnonKey.substring(0, 10))
    throw new Error(`Invalid API key format - should start with 'eyJ'`)
  }

  console.log('[Supabase] Creating client with valid credentials')
  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'hapien-auth',
      flowType: 'pkce',
    },
    cookies: {
      get(name) {
        if (typeof document === 'undefined') return undefined

        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1]

        return value
      },
      set(name, value, options) {
        if (typeof document === 'undefined') return

        // Detect if running in iOS PWA mode
        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true ||
                      document.referrer.includes('android-app://')

        const hostname = window.location.hostname
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

        // For iOS PWA, omit domain to improve persistence in standalone mode
        // iOS handles cookies differently in standalone PWA mode
        const domain = isPWA ? undefined : (isLocalhost ? undefined : hostname)

        const cookieOptions = {
          ...options,
          sameSite: 'lax' as const,
          path: '/',
          domain,
          secure: window.location.protocol === 'https:',
          maxAge: 365 * 24 * 60 * 60, // 1 year
        }

        let cookieString = `${name}=${value}; path=${cookieOptions.path}; max-age=${cookieOptions.maxAge}; samesite=${cookieOptions.sameSite}`
        if (cookieOptions.secure) cookieString += '; secure'
        if (cookieOptions.domain) cookieString += `; domain=${cookieOptions.domain}`

        document.cookie = cookieString
        console.log('[Supabase] Cookie set:', name, {
          domain: cookieOptions.domain,
          isPWA,
          secure: cookieOptions.secure
        })
      },
      remove(name, options) {
        if (typeof document === 'undefined') return

        // Use same PWA detection as set()
        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true

        const hostname = window.location.hostname
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
        const domain = isPWA ? undefined : (isLocalhost ? undefined : hostname)

        const cookieOptions = {
          ...options,
          sameSite: 'lax' as const,
          path: '/',
          domain,
          maxAge: -1,
        }

        let cookieString = `${name}=; path=${cookieOptions.path}; max-age=${cookieOptions.maxAge}; samesite=${cookieOptions.sameSite}`
        if (cookieOptions.domain) cookieString += `; domain=${cookieOptions.domain}`

        document.cookie = cookieString
      },
    },
  })

  // Setup auth state listener to sync with IndexedDB
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    console.log('[Supabase] Auth state changed:', event)

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // Save session to IndexedDB for backup
      if (session) {
        console.log('[Supabase] Saving session to IndexedDB backup')
        await sessionStorage.saveSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0,
          user: session.user,
        })
      }
    } else if (event === 'SIGNED_OUT') {
      // Clear IndexedDB backup
      console.log('[Supabase] Clearing session from IndexedDB backup')
      await sessionStorage.clearSession()
    }
  })

  // Eagerly try to restore session from IndexedDB if no active session
  if (!isRestoringSession && !restorationPromise) {
    isRestoringSession = true

    restorationPromise = supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        console.log('[Supabase] No active session, checking IndexedDB backup')
        const storedSession = await sessionStorage.getSession()

        if (storedSession) {
          console.log('[Supabase] Restoring session from IndexedDB backup')
          console.log('[Supabase] Session expires at:', new Date(storedSession.expires_at * 1000).toLocaleString())

          try {
            const { data, error } = await supabaseClient!.auth.setSession({
              access_token: storedSession.access_token,
              refresh_token: storedSession.refresh_token,
            })

            if (error) throw error

            console.log('[Supabase] ✅ Session restored successfully')
            console.log('[Supabase] User:', data.user?.email)
            restorationSuccess = true
          } catch (error) {
            console.error('[Supabase] ❌ Failed to restore session:', error)
            // Clear invalid session
            await sessionStorage.clearSession()
            restorationSuccess = false
          }
        } else {
          console.log('[Supabase] No backup session found in IndexedDB')
          restorationSuccess = false
        }
      } else {
        console.log('[Supabase] ✅ Active session found:', session.user?.email)
        restorationSuccess = true
      }

      // Mark restoration as complete and notify all listeners
      restorationComplete = true
      isRestoringSession = false
      console.log('[Supabase] Restoration complete. Success:', restorationSuccess)
      restorationListeners.forEach(callback => callback(restorationSuccess))
      restorationListeners.length = 0 // Clear listeners after notifying
    }).catch((error) => {
      console.error('[Supabase] ❌ Error during session restoration:', error)
      restorationComplete = true
      restorationSuccess = false
      isRestoringSession = false
      restorationListeners.forEach(callback => callback(false))
      restorationListeners.length = 0
    })
  }

  // Setup proactive token refresh for iOS PWA
  // iOS suspends PWA in background, so tokens may expire while app is suspended
  if (typeof window !== 'undefined') {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true ||
                  document.referrer.includes('android-app://')

    if (isPWA) {
      console.log('[Supabase] 📱 iOS PWA detected, enabling aggressive token refresh')

      // Refresh token when app becomes visible again
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          console.log('[Supabase] App became visible, checking session')

          try {
            const { data: { session } } = await supabaseClient!.auth.getSession()

            if (session) {
              const expiresAt = session.expires_at || 0
              const now = Date.now() / 1000
              const timeUntilExpiry = expiresAt - now

              // Refresh if expiring within 5 minutes
              if (timeUntilExpiry < 300) {
                console.log('[Supabase] ⏰ Token expiring soon, refreshing proactively')
                await supabaseClient!.auth.refreshSession()
              } else {
                console.log('[Supabase] ✅ Token valid for', Math.round(timeUntilExpiry / 60), 'minutes')
              }
            }
          } catch (error) {
            console.error('[Supabase] Error checking session on visibility change:', error)
          }
        }
      })

      // Also refresh on window focus (iOS PWA edge case)
      window.addEventListener('focus', async () => {
        console.log('[Supabase] Window focused, checking session')

        try {
          const { data: { session } } = await supabaseClient!.auth.getSession()

          if (session) {
            const expiresAt = session.expires_at || 0
            const now = Date.now() / 1000
            const timeUntilExpiry = expiresAt - now

            if (timeUntilExpiry < 300) {
              console.log('[Supabase] ⏰ Token expiring soon (focus), refreshing proactively')
              await supabaseClient!.auth.refreshSession()
            }
          }
        } catch (error) {
          console.error('[Supabase] Error on focus refresh:', error)
        }
      })
    }
  }

  return supabaseClient
}

// Helper function to ensure session is ready
export async function ensureSession(): Promise<{
  session: any | null
  restorationAttempted: boolean
  restorationSuccess: boolean
}> {
  // Wait for restoration if in progress
  if (restorationPromise && !restorationComplete) {
    await restorationPromise
  }

  const client = createClient()
  const { data: { session } } = await client.auth.getSession()

  return {
    session,
    restorationAttempted: restorationComplete,
    restorationSuccess
  }
}

// Register listener for restoration completion
export function onRestorationComplete(callback: (success: boolean) => void): void {
  if (restorationComplete) {
    // If restoration already complete, call immediately
    callback(restorationSuccess)
  } else {
    // Otherwise, queue for later
    restorationListeners.push(callback)
  }
}
