'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '@/types/database'

export function useAuth() {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user, setUser, setLoading } = useUserStore()
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    console.log('→ Fetching profile for user:', userId)
    try {
      const { data: profile, error } = await (supabase
        .from('users') as any)
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('✗ Profile fetch error:', error)
        // Don't throw - allow auth to complete even if profile fetch fails
        return null
      }

      if (profile) {
        console.log('✓ Profile loaded:', profile.name || profile.email)
        setUser(profile)
        return profile
      }

      return null
    } catch (error) {
      console.error('✗ Profile fetch exception:', error)
      return null
    }
  }, [supabase, setUser])

  useEffect(() => {
    console.log('=== useAuth: Initializing ===')
    
    const getSession = async () => {
      try {
        console.log('→ Getting session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('✗ Session error:', error)
          setAuthUser(null)
          setIsLoading(false)
          setLoading(false)
          return
        }

        console.log('Session result:', session ? 'Found' : 'Not found')
        setAuthUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('→ User authenticated, fetching profile...')
          await fetchProfile(session.user.id)
        }
        
        console.log('✓ Auth initialization complete')
        setIsLoading(false)
        setLoading(false)
      } catch (error) {
        console.error('✗ Session initialization error:', error)
        setAuthUser(null)
        setIsLoading(false)
        setLoading(false)
      }
    }

    getSession()

    console.log('→ Setting up auth state listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session')
        setAuthUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      console.log('→ Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile, setUser, setLoading])

  const signOut = async () => {
    console.log('→ Signing out...')
    try {
      await supabase.auth.signOut()
      setUser(null)
      setAuthUser(null)
      console.log('✓ Signed out successfully')
    } catch (error) {
      console.error('✗ Sign out error:', error)
    }
  }

  const refreshProfile = async () => {
    console.log('→ Refreshing profile...')
    if (authUser) {
      await fetchProfile(authUser.id)
    }
  }

  return {
    authUser,
    user,
    isLoading,
    signOut,
    refreshProfile,
    isAuthenticated: !!authUser,
    hasProfile: !!user?.name,
  }
}
