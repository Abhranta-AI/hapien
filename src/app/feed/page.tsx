'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'

export default function FeedPage() {
  const router = useRouter()
  const { authUser, user, isLoading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  // Redirect logic - handle auth states properly
  useEffect(() => {
    if (authLoading) return

    // Not logged in - redirect to login
    if (!authUser) {
      router.push('/auth/login')
      return
    }

    // Logged in but no profile or incomplete profile - redirect to onboarding
    if (!user?.name) {
      router.push('/onboarding')
      return
    }
  }, [authLoading, authUser, user, router])

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
