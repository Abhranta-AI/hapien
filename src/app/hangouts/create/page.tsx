'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/layout'
import { CreateHangout } from '@/components/hangouts/CreateHangout'
import { Card } from '@/components/ui/Card'
import { LoadingScreen } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Community } from '@/types/database'

export default function CreateHangoutPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user) return

      try {
        const { data: memberships } = await supabase
          .from('community_memberships')
          .select('community_id')
          .eq('user_id', user.id)
          .eq('status', 'approved')

        if (!memberships || memberships.length === 0) {
          setCommunities([])
          setIsLoading(false)
          return
        }

        const communityIds = (memberships as any[]).map((m: any) => m.community_id)

        const { data: communitiesData } = await supabase
          .from('communities')
          .select('*')
          .in('id', communityIds)

        setCommunities((communitiesData || []) as Community[])
      } catch (error) {
        console.error('Error fetching communities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommunities()
  }, [user, supabase])

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return null
  }

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-neutral-100">
              Host a Hangout
            </h1>
            <p className="text-neutral-400 mt-1">
              Bring your community together for something fun
            </p>
          </div>

          {/* Form or Empty State */}
          {communities.length === 0 ? (
            <EmptyState
              title="Join a community first"
              description="You need to be part of a community to host hangouts"
              action={{
                label: "Browse Communities",
                href: "/communities"
              }}
            />
          ) : (
            <Card variant="elevated" padding="lg">
              <CreateHangout communities={communities} />
            </Card>
          )}
        </div>
      </main>

    </AppShell>
  )
}
