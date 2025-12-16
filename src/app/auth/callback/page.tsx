'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import Link from 'next/link'

function AuthCallbackContent() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Verifying your login...')

  useEffect(() => {
    const supabase = createClient()
    let attempts = 0
    const maxAttempts = 10 // 10 attempts * 500ms = 5 seconds max
    const interval = 500
    let isActive = true // Track if component is still mounted

    const handleSuccessfulAuth = async (session: any) => {
      if (!isActive) return

      setStatus('Setting up your account...')
      console.log('✓ Session found, user:', session.user.id)

      try {
        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile check error:', profileError)
        }

        if (!profile) {
          console.log('→ Creating initial profile...')

          // Use upsert for idempotency - handles race conditions safely
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })

          if (upsertError) {
            console.error('Profile creation error:', upsertError)
            // Continue anyway - onboarding will handle it
          } else {
            console.log('✓ Profile created')
          }

          console.log('→ Redirecting to onboarding...')
          router.push('/onboarding')
        } else if (!profile.name) {
          console.log('→ Profile exists but onboarding incomplete')
          router.push('/onboarding')
        } else {
          console.log('→ Profile complete, redirecting to feed')
          router.push('/feed')
        }
      } catch (err) {
        console.error('Error in handleSuccessfulAuth:', err)
        if (isActive) {
          setError('Failed to set up your account. Please try again.')
        }
      }
    }

    const checkSession = async (): Promise<boolean> => {
      if (!isActive) return true // Stop if unmounted

      attempts++
      console.log(`Checking session... (attempt ${attempts}/${maxAttempts})`)

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          if (isActive) {
            setError(`Authentication error: ${sessionError.message}`)
          }
          return true // Stop polling
        }

        if (session) {
          console.log('✓ Session found!')
          await handleSuccessfulAuth(session)
          return true // Stop polling
        }

        if (attempts >= maxAttempts) {
          console.log('✗ Timeout - no session after max attempts')
          if (isActive) {
            setError(
              'Could not verify your login. This can happen if:\n\n' +
              '• You opened the link in a different browser\n' +
              '• You opened the link in incognito/private mode\n' +
              '• The link has expired (links expire after 1 hour)\n\n' +
              'Please request a new magic link from the login page.'
            )
          }
          return true // Stop polling
        }

        // Update status
        if (isActive) {
          setStatus(`Verifying your login...`)
        }

        return false // Continue polling
      } catch (err) {
        console.error('Error checking session:', err)
        if (isActive) {
          setError('An unexpected error occurred. Please try again.')
        }
        return true // Stop polling on error
      }
    }

    // Poll for session
    const poll = async () => {
      const shouldStop = await checkSession()
      if (!shouldStop && isActive) {
        setTimeout(poll, interval)
      }
    }

    // Start polling after a short delay to let Supabase process the code
    console.log('=== Auth callback started ===')
    console.log('URL:', window.location.href)
    const hasCode = window.location.search.includes('code=')
    console.log('Has auth code:', hasCode)

    setTimeout(poll, 500)

    // Cleanup
    return () => {
      isActive = false
    }
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-100 mb-4">
            Authentication Failed
          </h2>
          <p className="text-neutral-400 mb-6 whitespace-pre-line text-left text-sm">
            {error}
          </p>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-100 mb-2">
          {status}
        </h2>
        <p className="text-neutral-400">
          Please wait while we verify your login
        </p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-100 mb-2">
            Loading...
          </h2>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
