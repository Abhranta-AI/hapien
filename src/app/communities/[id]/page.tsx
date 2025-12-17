'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Home,
  GraduationCap,
  Building2,
  Plus,
  Check,
  Clock,
  Settings,
  Grid3X3,
} from 'lucide-react'
import { AppShell, FloatingActionButton } from '@/components/layout'
import { Avatar, AvatarGroup, Button, Card, Badge } from '@/components/ui'
import { PostCard, CreatePost } from '@/components/feed'
import { HangoutCard } from '@/components/hangouts/HangoutCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LoadingScreen, PostCardSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { 
  Community, 
  CommunityMembership, 
  User,
  PostWithRelations, 
  HangoutWithRelations 
} from '@/types/database'
import { cn, pluralize, communityTypeConfig } from '@/utils/helpers'
import toast from 'react-hot-toast'

type CommunityTab = 'posts' | 'hangouts' | 'members'

const typeIcons = {
  society: Home,
  campus: GraduationCap,
  office: Building2,
}

export default function CommunityDetailPage() {
  const params = useParams()
  const communityId = params.id as string
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<CommunityTab>('posts')
  const [community, setCommunity] = useState<Community | null>(null)
  const [membership, setMembership] = useState<CommunityMembership | null>(null)
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [hangouts, setHangouts] = useState<HangoutWithRelations[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)

  const fetchCommunity = useCallback(async () => {
    if (!user || !communityId) return

    setIsLoading(true)

    try {
      // Fetch community details
      const { data: communityData, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single()

      if (error) throw error
      setCommunity(communityData as Community)

      // Fetch user's membership status
      const { data: membershipData } = await supabase
        .from('community_memberships')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single()

      setMembership(membershipData as CommunityMembership | null)

      // Fetch community posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!user_id(*),
          community:communities!community_id(*),
          reactions(*),
          comments(count)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(20)

      const transformedPosts = ((postsData || []) as any[]).map(post => ({
        ...post,
        user: post.user,
        community: post.community,
        reactions: post.reactions || [],
        comments: [],
        reactions_count: post.reactions?.length || 0,
        comments_count: post.comments?.[0]?.count || 0,
      }))

      setPosts(transformedPosts)

      // Fetch community hangouts
      const { data: hangoutsData } = await supabase
        .from('hangouts')
        .select(`
          *,
          host:users!host_id(*),
          community:communities!community_id(*),
          rsvps:hangout_rsvps(*, user:users!user_id(*))
        `)
        .eq('community_id', communityId)
        .eq('status', 'upcoming')
        .order('date_time', { ascending: true })
        .limit(10)

      const transformedHangouts = ((hangoutsData || []) as any[]).map(hangout => ({
        ...hangout,
        host: hangout.host,
        community: hangout.community,
        rsvps: hangout.rsvps || [],
        comments: [],
        going_count: hangout.rsvps?.filter((r: any) => r.status === 'going').length || 0,
        interested_count: hangout.rsvps?.filter((r: any) => r.status === 'interested').length || 0,
      }))

      setHangouts(transformedHangouts)

      // Fetch community members
      const { data: membershipsData } = await supabase
        .from('community_memberships')
        .select('user_id')
        .eq('community_id', communityId)
        .eq('status', 'approved')
        .limit(50)

      if (membershipsData && membershipsData.length > 0) {
        const userIds = (membershipsData as any[]).map((m: any) => m.user_id)
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds)

        setMembers((usersData || []) as User[])
      }
    } catch (error) {
      console.error('Error fetching community:', error)
      toast.error('Failed to load community')
    } finally {
      setIsLoading(false)
    }
  }, [user, communityId, supabase])

  useEffect(() => {
    fetchCommunity()
  }, [fetchCommunity])

  const handleJoin = async () => {
    if (!user || !communityId) return

    setIsJoining(true)

    try {
      await (supabase.from('community_memberships') as any).insert({
        user_id: user.id,
        community_id: communityId,
        status: 'pending',
        role: 'member',
      })

      toast.success('Request sent! Waiting for admin approval.')
      fetchCommunity()
    } catch (error) {
      console.error('Error joining:', error)
      toast.error('Failed to join community')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!user || !membership) return

    setIsJoining(true)

    try {
      await supabase
        .from('community_memberships')
        .delete()
        .eq('id', membership.id)

      toast.success('Left community')
      fetchCommunity()
    } catch (error) {
      console.error('Error leaving:', error)
      toast.error('Failed to leave community')
    } finally {
      setIsJoining(false)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingScreen message="Loading community..." />
  }

  if (!user || !community) {
    return (
      <AppShell>
        <main className="min-h-screen pt-16 pb-24 flex items-center justify-center">
          <EmptyState
            icon={Home}
            title="Community not found"
            description="This community may have been removed or doesn't exist."
            action={{ label: "Browse Communities", href: "/communities" }}
          />
        </main>
      </AppShell>
    )
  }

  const TypeIcon = typeIcons[community.type]
  const typeConfig = communityTypeConfig[community.type]
  const isMember = membership?.status === 'approved'
  const isPending = membership?.status === 'pending'
  const isAdmin = membership?.role === 'admin' || community.admin_id === user.id

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        {/* Cover & Header */}
        <div className={cn(
          'h-48 bg-gradient-to-br relative',
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          
          {/* Back Button */}
          <Link
            href="/communities"
            className="absolute top-4 left-4 p-2 bg-dark-card/20 backdrop-blur-sm rounded-full text-white hover:bg-dark-card/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Admin Settings */}
          {isAdmin && (
            <Link
              href={`/communities/${community.id}/admin`}
              className="absolute top-4 right-4 p-2 bg-dark-card/20 backdrop-blur-sm rounded-full text-white hover:bg-dark-card/30 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
          {/* Info Card */}
          <Card variant="elevated" className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <Badge variant="default" size="sm" className="mb-2">
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {typeConfig.label}
                </Badge>
                <h1 className="text-2xl font-display font-bold text-neutral-100">
                  {community.name}
                </h1>
                {community.description && (
                  <p className="text-neutral-400 mt-2">{community.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
                  {community.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {community.location.address}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {community.member_count} {pluralize(community.member_count, 'member')}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                {isMember ? (
                  <Button
                    variant="outline"
                    onClick={handleLeave}
                    disabled={isJoining}
                  >
                    {isJoining ? 'Leaving...' : 'Leave Community'}
                  </Button>
                ) : isPending ? (
                  <Button variant="ghost" disabled>
                    <Clock className="w-4 h-4 mr-2" />
                    Request Pending
                  </Button>
                ) : (
                  <Button onClick={handleJoin} disabled={isJoining}>
                    {isJoining ? 'Joining...' : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Join Community
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Member Preview */}
            {members.length > 0 && (
              <div className="mt-6 pt-6 border-t border-dark-border">
                <div className="flex items-center justify-between">
                  <AvatarGroup users={members.slice(0, 8)} size="sm" max={8} />
                  <Link
                    href="#members"
                    onClick={() => setActiveTab('members')}
                    className="text-sm text-primary-400 hover:underline"
                  >
                    See all members
                  </Link>
                </div>
              </div>
            )}
          </Card>

          {/* Content Tabs */}
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CommunityTab)}>
              <TabsList>
                <TabsTrigger value="posts">
                  <Grid3X3 className="w-4 h-4 mr-1.5" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="hangouts">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Hangouts
                </TabsTrigger>
                <TabsTrigger value="members">
                  <Users className="w-4 h-4 mr-1.5" />
                  Members
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-4">
                {/* Create Post (only for members) */}
                {isMember && (
                  <div className="mb-4">
                    <CreatePost 
                      communityId={community.id} 
                      onPostCreated={fetchCommunity} 
                    />
                  </div>
                )}

                {posts.length === 0 ? (
                  <EmptyState
                    icon={Grid3X3}
                    title="No posts yet"
                    description={isMember ? "Be the first to post!" : "Join to see and create posts"}
                  />
                ) : (
                  <div className="space-y-4">
                    {posts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <PostCard post={post} onReaction={fetchCommunity} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="hangouts" className="mt-4">
                {hangouts.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No upcoming hangouts"
                    description={isMember ? "Host a hangout for your community!" : "Join to see and create hangouts"}
                    action={isMember ? { label: "Create Hangout", href: "/hangouts/create" } : undefined}
                  />
                ) : (
                  <div className="space-y-4">
                    {hangouts.map((hangout, index) => (
                      <motion.div
                        key={hangout.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <HangoutCard hangout={hangout} onRsvpChange={fetchCommunity} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="members" className="mt-4">
                {members.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No members yet"
                    description="Be the first to join!"
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {members.map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={`/profile/${member.id}`}>
                          <Card className="p-4 hover:shadow-soft-lg transition-shadow">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={member.avatar_url}
                                name={member.name || 'User'}
                                size="md"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-neutral-100 truncate">
                                  {member.name}
                                </p>
                                {member.bio && (
                                  <p className="text-sm text-neutral-500 truncate">
                                    {member.bio}
                                  </p>
                                )}
                              </div>
                              {member.id === community.admin_id && (
                                <Badge variant="primary" size="sm">Admin</Badge>
                              )}
                            </div>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {isMember && <FloatingActionButton />}
    </AppShell>
  )
}
