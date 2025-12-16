'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)

      if (session?.user) {
        // Fetch user profile
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            setUser(data)
            clearTimeout(timeoutId)
            setIsLoading(false)
          })
          .catch(() => {
            clearTimeout(timeoutId)
            setIsLoading(false)
          })
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
          // Fetch updated profile on auth change
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          setUser(data)
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

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    setUser(data)
  }, [authUser?.id, supabase])

  // Function to sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setAuthUser(null)
    setUser(null)
  }, [supabase])

  return { authUser, user, isLoading, refreshProfile, signOut }
}
