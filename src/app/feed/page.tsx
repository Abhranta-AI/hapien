'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'

export default function FeedPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, authUser } = useAuth()
  const [feedLoading, setFeedLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
    const [redirectAttempted, setRedirectAttempted] = useState(false)

  useEffect(() => {
    console.log('=== Feed Page Loaded ===')
    console.log('authLoading:', authLoading)
    console.log('authUser:', authUser)
    console.log('user:', user)

    // Wait for auth to finish loading
    if (authLoading) {
      console.log('→ Waiting for auth...')
      return
    }

    // Check authentication
    if (!authUser) {
      console.log('✗ No auth user, redirecting to login')
      router.push('/auth/login')
      return
    }

    // Check profile completion - but only if user data has loaded
    // If authUser exists but user is null, the profile might still be loading
    if (authUser && user === null) {
      // User profile not loaded yet, wait a bit more
      // But set a safety timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('⏱️ Feed page timeout - profile may not exist')
        setFeedLoading(false)
      }, 3000)
      return () => clearTimeout(timeout)
    }

    // Now user data is loaded (could be undefined if no profile, or an object)
    if (!user?.name) {
      console.log('✗ Profile incomplete, redirecting to onboarding')
      router.push('/onboarding')
      return
    }

    // Handle redirect after successful auth
    if (!redirectAttempted) {
      const searchParams = new URLSearchParams(window.location.search)
      const redirectTo = searchParams.get('from')

      if (redirectTo) {
        console.log('Redirecting to intended destination:', redirectTo)
        setRedirectAttempted(true)
        router.push(redirectTo)
        return
      }
      setRedirectAttempted(true)
    }

    console.log('✓ User authenticated and profile complete')
    setFeedLoading(false)
  }, [authLoading, authUser, user, router, redirectAttempted])

  // Show loading while checking auth
  if (authLoading || feedLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-100 mb-2">
            Loading your feed...
          </h2>
          <p className="text-neutral-400">
            Please wait a moment
          </p>
        </div>
      </div>
    )
  }

  // Show error if any
  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card rounded-3xl p-8 text-center border border-dark-border">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-neutral-400 mb-6">
            {error}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/')}
            >
              Go Home
            </Button>
            <Button
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main feed content
  return (
    <AppShell>
      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Welcome Message */}
          <div className="bg-dark-card rounded-3xl p-8 text-center border border-dark-border mb-6">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-neutral-100 mb-2">
              Welcome to Hapien, {user?.name}!
            </h1>
            <p className="text-neutral-400 mb-6">
              Your feed is coming soon. We're building something special for you.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push('/profile')}
                className="w-full"
              >
                View Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/communities')}
                className="w-full"
              >
                Explore Communities
              </Button>
            </div>
          </div>

          {/* Debug Info (temporary - remove later) */}
          <div className="bg-dark-hover rounded-2xl p-4 text-xs text-neutral-500 border border-dark-border">
            <p className="font-medium text-neutral-300 mb-2">Debug Info:</p>
            <p>✓ Authenticated: {authUser ? 'Yes' : 'No'}</p>
            <p>✓ Profile loaded: {user ? 'Yes' : 'No'}</p>
            <p>✓ User ID: {authUser?.id?.slice(0, 8)}...</p>
            <p>✓ Name: {user?.name}</p>
            <p>✓ Email: {user?.email || authUser?.email}</p>
          </div>
        </div>
      </main>

    </AppShell>
  )
}
