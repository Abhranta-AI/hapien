'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      console.log('=== Auth callback started ===')
      
      try {
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('✗ Session error:', sessionError)
          throw sessionError
        }

        if (!session) {
          console.error('✗ No session found')
          router.push('/auth?error=no-session')
          return
        }

        console.log('✓ Session found:', session.user.id)
        console.log('User email:', session.user.email)

        // Check if user profile exists
        const { data: profile, error: profileError } = await (supabase
          .from('users') as any)
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('✗ Profile check error:', profileError)
        }

        if (!profile) {
          console.log('→ No profile found, creating initial profile...')
          
          // Create initial user profile
          const { error: insertError } = await (supabase
            .from('users') as any)
            .insert({
              id: session.user.id,
              email: session.user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('✗ Profile creation error:', insertError)
            // Continue anyway - onboarding will handle it
          } else {
            console.log('✓ Initial profile created')
          }

          console.log('→ Redirecting to onboarding...')
          router.push('/onboarding')
        } else {
          console.log('✓ Profile exists:', profile)
          
          // Check if onboarding is complete
          if (!profile.name) {
            console.log('→ Onboarding incomplete, redirecting to onboarding...')
            router.push('/onboarding')
          } else {
            console.log('→ Onboarding complete, redirecting to feed...')
            router.push('/feed')
          }
        }

      } catch (error) {
        console.error('✗✗✗ Callback error:', error)
        router.push('/auth?error=callback-failed')
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-100 mb-2">
          Signing you in...
        </h2>
        <p className="text-neutral-400">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  )
}
