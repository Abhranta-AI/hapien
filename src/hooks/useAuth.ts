'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient, ensureSession } from '@/lib/supabase/client'

// Helper to fetch profile via direct REST API (more reliable)
async function fetchProfileDirect(userId: string): Promise<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    return data?.[0] ?? null
  } catch {
    return null
  }
}

export function useAuth() {
  const [authUser, setAuthUser] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isActive = true

    // Safety timeout - force loading to false after 10 seconds
    const timeoutId = setTimeout(() => {
      if (isActive) {
        console.warn('[useAuth] Timeout reached, forcing loading to false')
        setIsLoading(false)
      }
    }, 10000)

    // Wait for restoration before checking session
    const initAuth = async () => {
      try {
        // This will wait for restoration to complete
        const { session, restorationAttempted, restorationSuccess } = await ensureSession()

        console.log('[useAuth] Restoration complete', {
          attempted: restorationAttempted,
          success: restorationSuccess,
          hasSession: !!session
        })

        if (!isActive) return

        setAuthUser(session?.user ?? null)

        if (session?.user) {
          // Fetch user profile via direct fetch (more reliable)
          const profileData = await fetchProfileDirect(session.user.id)
          if (isActive) {
            setUser(profileData)
          }
        }
      } catch (error) {
        console.error('[useAuth] Error during init:', error)
      } finally {
        if (isActive) {
          clearTimeout(timeoutId)
          setIsLoading(false)
        }
      }
    }

    initAuth()

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isActive) return

        setAuthUser(session?.user ?? null)

        if (session?.user) {
          // Fetch updated profile on auth change via direct fetch
          const profileData = await fetchProfileDirect(session.user.id)
          if (isActive) {
            setUser(profileData)
          }
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      isActive = false
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [])

  // Function to refresh user profile data
  const refreshProfile = useCallback(async () => {
    if (!authUser?.id) return

    const profileData = await fetchProfileDirect(authUser.id)
    setUser(profileData)
  }, [authUser?.id])

  // Function to sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setAuthUser(null)
    setUser(null)
  }, [supabase])

  return { authUser, user, isLoading, refreshProfile, signOut }
}
