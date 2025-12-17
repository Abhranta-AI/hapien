'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, User } from 'lucide-react'
import { AppShell } from '@/components/layout'
import { useAuth } from '@/hooks/useAuth'
import { Button, Card } from '@/components/ui'
import { getGreeting } from '@/utils/helpers'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function FeedPage() {
  const router = useRouter()
  const { authUser, user, isLoading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">
            Loading your feed...
          </h2>
          <p className="text-stone-500">
            Please wait a moment
          </p>
        </div>
      </div>
    )
  }

  // Show message if not logged in
  if (!authUser) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">
            Login Required
          </h2>
          <p className="text-stone-500 mb-6">
            You need to be logged in to see your feed. Please log in or explore our communities.
          </p>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="secondary" className="w-full">
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-stone-500 mb-6">
            Before you can access your feed, please complete your profile setup. This will only take a moment!
          </p>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="secondary" className="w-full">
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-stone-500 mb-6">
            {error}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
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
        </Card>
      </div>
    )
  }

  const greeting = getGreeting()

  // Main feed content
  return (
    <AppShell>
      <main className="min-h-screen pt-16 pb-24 bg-stone-50">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Greeting */}
          <div className="mb-6">
            <p className="text-stone-500 text-sm">{greeting}, {user?.name?.split(' ')[0]}</p>
            <h1 className="font-display text-2xl font-bold text-stone-900">
              What brings you joy today?
            </h1>
          </div>

          {/* Welcome Message */}
          <Card variant="elevated" className="p-8 text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-warm">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-stone-900 mb-2">
              Welcome to Hapien!
            </h2>
            <p className="text-stone-500 mb-6">
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
                variant="secondary"
                onClick={() => router.push('/communities')}
                className="w-full"
              >
                Explore Communities
              </Button>
            </div>
          </Card>

        </div>
      </main>

    </AppShell>
  )
}
