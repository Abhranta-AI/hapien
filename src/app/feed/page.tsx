'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, User } from 'lucide-react'
import { AppShell } from '@/components/layout'
import { useAuth } from '@/hooks/useAuth'
import { Button, Card } from '@/components/ui'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function FeedPage() {
  const router = useRouter()
  const { authUser, user, isLoading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  // Show loading while checking auth
  if (authLoading) {
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

  // Show message if not logged in
  if (!authUser) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-100 mb-2">
            Login Required
          </h2>
          <p className="text-neutral-400 mb-6">
            You need to be logged in to see your feed. Please log in or explore our communities.
          </p>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full">
                Log In
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Show message if profile incomplete
  if (!user?.name) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-100 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-neutral-400 mb-6">
            Before you can access your feed, please complete your profile setup. This will only take a moment!
          </p>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
            <Link href="/onboarding" className="flex-1">
              <Button className="w-full">
                Complete Profile
              </Button>
            </Link>
          </div>
        </Card>
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

        </div>
      </main>

    </AppShell>
  )
}
