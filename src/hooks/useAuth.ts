'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ULTRA-MINIMAL VERSION FOR DIAGNOSTICS
// This version does NOTHING except set isLoading to false after 2 seconds
// If this doesn't work, the problem is NOT in useAuth

export function useAuth() {
  const [authUser, setAuthUser] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    console.log('🚨 DIAGNOSTIC MODE: useAuth effect started')
    console.log('Current time:', new Date().toISOString())
    
    // Force loading to false after 2 seconds NO MATTER WHAT
    const timer = setTimeout(() => {
      console.log('🚨 DIAGNOSTIC: Setting isLoading to FALSE now')
      setIsLoading(false)
    }, 2000)

    // Try to get session but don't block on it
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🚨 DIAGNOSTIC: Session result:', session ? 'Has session' : 'No session')
      if (session?.user) {
        setAuthUser(session.user as any)
        console.log('🚨 DIAGNOSTIC: User email:', session.user.email)
      }
    }).catch(err => {
      console.error('🚨 DIAGNOSTIC: Session error:', err)
    })

    return () => {
      console.log('🚨 DIAGNOSTIC: Cleanup running')
      clearTimeout(timer)
    }
  }, [])

  console.log('🚨 DIAGNOSTIC: Render - isLoading =', isLoading)

  return {
    authUser,
    user,
    isLoading,
    signOut: async () => {},
    refreshProfile: async () => {},
    isAuthenticated: !!authUser,
    hasProfile: false,
  }
}

export function useOTPAuth() {
  return {
    sendOTP: async () => {},
    verifyOTP: async () => {},
    isLoading: false,
    error: null,
    clearError: () => {},
  }
}
