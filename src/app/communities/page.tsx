'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  MapPin,
  Users,
  Home,
  GraduationCap,
  Building2,
  Filter,
  Plus,
  Check,
  Clock,
} from 'lucide-react'
import { BottomNav } from '@/components/layout'
import { Button, Card, Badge, Input } from '@/components/ui'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { LoadingScreen, LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Community, CommunityMembership } from '@/types/database'
import { cn, pluralize, communityTypeConfig } from '@/utils/helpers'
import toast from 'react-hot-toast'

type CommunityType = 'all' | 'society' | 'campus' | 'office'

const typeIcons = {
  society: Home,
  campus: GraduationCap,
  office: Building2,
}

export default function CommunitiesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [typeFilter, setTypeFilter] = useState<CommunityType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [communities, setCommunities] = useState<Community[]>([])
  const [memberships, setMemberships] = useState<Record<string, CommunityMembership>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const fetchCommunities = useCallback(async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // Fetch user's memberships
      const { data: membershipData } = await supabase
        .from('community_memberships')
        .select('*')
        .eq('user_id', user.id)

      const membershipMap: Record<string, CommunityMembership> = {}
      ;((membershipData || []) as any[]).forEach((m: any) => {
        membershipMap[m.community_id] = m
      })
      setMemberships(membershipMap)

      // Fetch communities
      let query = supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false })

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter)
      }

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery}%`)
      }

      const { data: communitiesData, error } = await query.limit(50)

      if (error) throw error

      setCommunities((communitiesData || []) as Community[])
    } catch (error) {
      console.error('Error fetching communities:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, typeFilter, searchQuery, supabase])

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) return

    setJoiningId(communityId)

    try {
      await (supabase.from('community_memberships') as any).insert({
        user_id: user.id,
        community_id: communityId,
        status: 'pending',
        role: 'member',
      })

      toast.success('Request sent! Waiting for admin approval.')
      fetchCommunities()
    } catch (error) {
      console.error('Error joining community:', error)
      toast.error('Failed to join community')
    } finally {
      setJoiningId(null)
    }
  }

  const handleLeaveCommunity = async (communityId: string) => {
    if (!user) return

    const membership = memberships[communityId]
    if (!membership) return

    setJoiningId(communityId)

    try {
      await supabase
        .from('community_memberships')
        .delete()
        .eq('id', membership.id)

      toast.success('Left community')
      fetchCommunities()
    } catch (error) {
      console.error('Error leaving community:', error)
      toast.error('Failed to leave community')
    } finally {
      setJoiningId(null)
    }
  }

  if (authLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="min-h-screen pt-16 pb-24 bg-gradient-to-b from-tertiary-50/30 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-neutral-100">
                Communities
              </h1>
              <p className="text-neutral-400 mt-1">
                Find and join communities in your area
              </p>
            </div>
            <Link href="/communities/create">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-card rounded-xl border border-dark-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="mb-6">
            <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as CommunityType)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="society">
                  <Home className="w-4 h-4 mr-1.5" />
                  Society
                </TabsTrigger>
                <TabsTrigger value="campus">
                  <GraduationCap className="w-4 h-4 mr-1.5" />
                  Campus
                </TabsTrigger>
                <TabsTrigger value="office">
                  <Building2 className="w-4 h-4 mr-1.5" />
                  Office
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Communities List */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : communities.length === 0 ? (
            <EmptyState
              icon={Home}
              title="No communities found"
              description={
                searchQuery
                  ? "Try a different search term"
                  : "Be the first to create a community in your area!"
              }
            />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-4 sm:grid-cols-2">
                {communities.map((community, index) => {
                  const membership = memberships[community.id]
                  const TypeIcon = typeIcons[community.type]
                  const typeConfig = communityTypeConfig[community.type]

                  return (
                    <motion.div
                      key={community.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden hover:shadow-soft-lg transition-shadow">
                        {/* Cover Image or Gradient */}
                        <div className={cn(
                          'h-24 bg-gradient-to-br',
                          community.type === 'society' && 'from-tertiary-400 to-tertiary-600',
                          community.type === 'campus' && 'from-primary-400 to-primary-600',
                          community.type === 'office' && 'from-secondary-400 to-secondary-600',
                        )}>
                          {community.cover_image_url && (
                            <img
                              src={community.cover_image_url}
                              alt={community.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="p-4">
                          {/* Type Badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default" size="sm">
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {typeConfig.label}
                            </Badge>
                            {membership?.status === 'approved' && (
                              <Badge variant="success" size="sm">
                                <Check className="w-3 h-3 mr-1" />
                                Member
                              </Badge>
                            )}
                            {membership?.status === 'pending' && (
                              <Badge variant="warning" size="sm">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>

                          {/* Name & Description */}
                          <Link href={`/communities/${community.id}`}>
                            <h3 className="font-semibold text-neutral-100 hover:text-primary-400 transition-colors">
                              {community.name}
                            </h3>
                          </Link>
                          {community.description && (
                            <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                              {community.description}
                            </p>
                          )}

                          {/* Location & Members */}
                          <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
                            {community.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {community.location.city || community.location.address}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {community.member_count} {pluralize(community.member_count, 'member')}
                            </span>
                          </div>

                          {/* Action Button */}
                          <div className="mt-4">
                            {membership?.status === 'approved' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleLeaveCommunity(community.id)}
                                disabled={joiningId === community.id}
                              >
                                {joiningId === community.id ? 'Leaving...' : 'Leave Community'}
                              </Button>
                            ) : membership?.status === 'pending' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                disabled
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Request Pending
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleJoinCommunity(community.id)}
                                disabled={joiningId === community.id}
                              >
                                {joiningId === community.id ? 'Joining...' : (
                                  <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Join Community
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
