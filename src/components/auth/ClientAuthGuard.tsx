'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface ClientAuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireProfile?: boolean
}

/**
 * Client-side auth guard that waits for session restoration before redirecting
 * This is necessary for iOS PWA where server-side middleware can't see restored sessions
 */
export function ClientAuthGuard({
  children,
  requireAuth = true,
  requireProfile = true
}: ClientAuthGuardProps) {
  const router = useRouter()
  const { authUser, user, isLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)
  const [restorationDone, setRestorationDone] = useState(false)

  useEffect(() => {
    // Import dynamically to avoid SSR issues
    import('@/lib/supabase/client').then(({ onRestorationComplete }) => {
      onRestorationComplete((success) => {
        console.log('[ClientAuthGuard] Restoration completed:', success)
        setRestorationDone(true)
        setIsChecking(false)
      })
    })

    // Fallback timeout in case restoration callback doesn't fire
    const fallbackTimer = setTimeout(() => {
      console.warn('[ClientAuthGuard] Fallback timeout reached')
      setRestorationDone(true)
      setIsChecking(false)
    }, 5000)

    console.log('[ClientAuthGuard] Waiting for session restoration...')
    return () => clearTimeout(fallbackTimer)
  }, [])

  useEffect(() => {
    // Don't check auth until restoration is done and useAuth loading is complete
    if (isLoading || isChecking || !restorationDone) {
      console.log('[ClientAuthGuard] Still waiting...', {
        isLoading,
        isChecking,
        restorationDone
      })
      return
    }

    console.log('[ClientAuthGuard] Auth check complete', {
      authUser: !!authUser,
      userEmail: authUser?.email,
      hasProfile: !!user,
      profileName: user?.name,
      requireAuth,
      requireProfile
    })

    // Check authentication
    if (requireAuth && !authUser) {
      console.log('[ClientAuthGuard] ❌ No auth user, redirecting to login')
      router.push('/auth/login')
      return
    }

    // Check profile completion
    if (requireProfile && authUser && !user?.name) {
      console.log('[ClientAuthGuard] ❌ Profile incomplete, redirecting to onboarding')
      router.push('/onboarding')
      return
    }

    console.log('[ClientAuthGuard] ✅ Auth checks passed')
  }, [authUser, user, isLoading, isChecking, restorationDone, requireAuth, requireProfile, router])

  // Show loading while checking auth
  if (isLoading || isChecking || !restorationDone) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-stone-400">
            {!restorationDone ? 'Restoring session...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // If we get here, auth checks passed
  return <>{children}</>
}
