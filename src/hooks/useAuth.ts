'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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
    // Safety timeout - force loading to false after 5 seconds
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 5000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setAuthUser(session?.user ?? null)

      if (session?.user) {
        // Fetch user profile via direct fetch (more reliable)
        const profileData = await fetchProfileDirect(session.user.id)
        setUser(profileData)
        clearTimeout(timeoutId)
        setIsLoading(false)
      } else {
        clearTimeout(timeoutId)
        setIsLoading(false)
      }
    }).catch(() => {
      clearTimeout(timeoutId)
      setIsLoading(false)
    })

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthUser(session?.user ?? null)

        if (session?.user) {
          // Fetch updated profile on auth change via direct fetch
          const profileData = await fetchProfileDirect(session.user.id)
          setUser(profileData)
        } else {
          setUser(null)
        }
      }
    )

    return () => {
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
