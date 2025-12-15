'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [authUser, setAuthUser] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    console.log('🔵 useAuth: Effect started')

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🟢 Session result:', session ? 'Has session' : 'No session')
      setAuthUser(session?.user ?? null)

      if (session?.user) {
        console.log('🟠 Fetching profile for:', session.user.email)
        // Fetch user profile
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            console.log('🟡 Profile loaded:', data?.name)
            setUser(data)
            setIsLoading(false) // ← Set loading false after profile loads
          })
          .catch((err) => {
            console.error('🔴 Profile fetch error:', err)
            setIsLoading(false) // ← Set loading false even on error
          })
      } else {
        console.log('🔵 NO session, setting isLoading to false')
        setIsLoading(false) // ← Set loading false if no session
      }
    }).catch((err) => {
      console.error('🔴 Session error:', err)
      setIsLoading(false) // ← Set loading false on session error
    })

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🟣 Auth state changed:', event)
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

    return () => subscription.unsubscribe()
  }, [])

  return { authUser, user, isLoading }
}
