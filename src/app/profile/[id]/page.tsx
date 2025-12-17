'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  UserCheck,
  Clock,
  MessageCircle,
  Home,
  Calendar,
  Grid3X3,
  MapPin,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Avatar, Button, Card, Badge } from '@/components/ui'
import { PostCard, WallPost } from '@/components/feed'
import { HangoutCard } from '@/components/hangouts/HangoutCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LoadingScreen, PostCardSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  User,
  Friendship,
  Community,
  PostWithRelations,
  HangoutWithRelations,
} from '@/types/database'
import { pluralize } from '@/utils/helpers'
import toast from 'react-hot-toast'

type ProfileTab = 'posts' | 'hangouts' | 'communities'
type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends'

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const { user: currentUser, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [profile, setProfile] = useState<User | null>(null)
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none')
  const [friendship, setFriendship] = useState<Friendship | null>(null)
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [hangouts, setHangouts] = useState<HangoutWithRelations[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [friendsCount, setFriendsCount] = useState(0)
  const [mutualFriends, setMutualFriends] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Redirect if viewing own profile
  useEffect(() => {
    if (currentUser && userId === currentUser.id) {
      router.replace('/profile')
    }
  }, [currentUser, userId, router])

  const fetchProfile = useCallback(async () => {
    if (!currentUser) return

    setIsLoading(true)

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      setProfile(profileData as User)

      // Fetch friendship status
      const { data: friendshipData } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id})`)
        .single()

      if (friendshipData) {
        const f = friendshipData as Friendship
        setFriendship(f)
        if (f.status === 'accepted') {
          setFriendshipStatus('friends')
        } else if (f.status === 'pending') {
          if (f.requester_id === currentUser.id) {
            setFriendshipStatus('pending_sent')
          } else {
            setFriendshipStatus('pending_received')
          }
        }
      } else {
        setFriendshipStatus('none')
        setFriendship(null)
      }

      // Fetch friends count
      const { count: friendCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted')

      setFriendsCount(friendCount || 0)

      // Fetch mutual friends
      const { data: myFriendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)
        .eq('status', 'accepted')

      const { data: theirFriendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted')

      const myFriendIds = new Set(
        ((myFriendships || []) as any[]).map((f: any) =>
          f.requester_id === currentUser.id ? f.addressee_id : f.requester_id
        )
      )

      const theirFriendIds = ((theirFriendships || []) as any[]).map((f: any) =>
        f.requester_id === userId ? f.addressee_id : f.requester_id
      )

      const mutualIds = theirFriendIds.filter(id => myFriendIds.has(id))

      if (mutualIds.length > 0) {
        const { data: mutualData } = await supabase
          .from('users')
          .select('*')
          .in('id', mutualIds.slice(0, 5))

        setMutualFriends((mutualData || []) as User[])
      }

      // Fetch user's posts (only visible ones based on friendship)
      const isFriend = (friendshipData as Friendship | null)?.status === 'accepted'
      
      let postsQuery = supabase
        .from('posts')
        .select(`
          *,
          user:users!user_id(*),
          community:communities!community_id(*),
          reactions(*),
          comments(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      // Filter based on visibility
      if (!isFriend) {
        // Non-friends can only see community posts if they're in the same community
        postsQuery = postsQuery.eq('visibility', 'community_only')
      }

      const { data: postsData } = await postsQuery

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

      // Fetch user's hangouts
      const { data: hangoutsData } = await supabase
        .from('hangouts')
        .select(`
          *,
          host:users!host_id(*),
          community:communities!community_id(*),
          rsvps:hangout_rsvps(*, user:users!user_id(*))
        `)
        .eq('host_id', userId)
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

      // Fetch user's communities
      const { data: memberships } = await supabase
        .from('community_memberships')
        .select('community_id')
        .eq('user_id', userId)
        .eq('status', 'approved')

      if (memberships && memberships.length > 0) {
        const communityIds = (memberships as any[]).map((m: any) => m.community_id)
        const { data: communitiesData } = await supabase
          .from('communities')
          .select('*')
          .in('id', communityIds)

        setCommunities((communitiesData || []) as Community[])
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, userId, supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSendFriendRequest = async () => {
    if (!currentUser) return

    setActionLoading(true)
    try {
      const { error } = await (supabase.from('friendships') as any).insert({
        requester_id: currentUser.id,
        addressee_id: userId,
        status: 'pending',
      })

      if (error) throw error

      setFriendshipStatus('pending_sent')
      toast.success('Friend request sent!')
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error('Failed to send friend request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAcceptRequest = async () => {
    if (!friendship) return

    setActionLoading(true)
    try {
      const { error } = await (supabase
        .from('friendships') as any)
        .update({ status: 'accepted' })
        .eq('id', friendship.id)

      if (error) throw error

      setFriendshipStatus('friends')
      toast.success('Friend request accepted!')
      fetchProfile()
    } catch (error) {
      console.error('Error accepting friend request:', error)
      toast.error('Failed to accept friend request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectRequest = async () => {
    if (!friendship) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendship.id)

      if (error) throw error

      setFriendshipStatus('none')
      setFriendship(null)
      toast.success('Friend request declined')
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      toast.error('Failed to decline friend request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!friendship) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendship.id)

      if (error) throw error

      setFriendshipStatus('none')
      setFriendship(null)
      toast.success('Friend request cancelled')
    } catch (error) {
      console.error('Error cancelling friend request:', error)
      toast.error('Failed to cancel friend request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveFriend = async () => {
    if (!friendship) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendship.id)

      if (error) throw error

      setFriendshipStatus('none')
      setFriendship(null)
      setFriendsCount(prev => prev - 1)
      toast.success('Friend removed')
      fetchProfile()
    } catch (error) {
      console.error('Error removing friend:', error)
      toast.error('Failed to remove friend')
    } finally {
      setActionLoading(false)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!currentUser || !profile) {
    return (
      <AppShell>
        <main className="min-h-screen pt-16 pb-24 flex items-center justify-center">
          <EmptyState
            title="User not found"
            description="This user doesn't exist or has been removed"
            action={{ label: "Go Home", href: "/feed" }}
          />
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 pt-8 pb-20 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-primary-100 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.name || 'User'}
                  size="xl"
                />
                <div>
                  <h1 className="text-2xl font-display font-bold text-white">
                    {profile.name}
                  </h1>
                  {profile.bio && (
                    <p className="text-primary-100 mt-1 max-w-sm">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Actions Card */}
        <div className="max-w-2xl mx-auto px-4 -mt-12">
          <Card variant="elevated" className="p-6">
            {/* Stats */}
            <div className="flex items-center justify-around mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-100">{friendsCount}</p>
                <p className="text-sm text-neutral-500">{pluralize(friendsCount, 'Friend')}</p>
              </div>
              <div className="h-10 w-px bg-neutral-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-100">{communities.length}</p>
                <p className="text-sm text-neutral-500">{pluralize(communities.length, 'Community', 'Communities')}</p>
              </div>
              <div className="h-10 w-px bg-neutral-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-100">{posts.length}</p>
                <p className="text-sm text-neutral-500">{pluralize(posts.length, 'Post')}</p>
              </div>
            </div>

            {/* Mutual Friends */}
            {mutualFriends.length > 0 && (
              <div className="mb-6 pb-6 border-b border-dark-border">
                <p className="text-sm text-neutral-500 mb-2">
                  {mutualFriends.length} mutual {pluralize(mutualFriends.length, 'friend')}
                </p>
                <div className="flex -space-x-2">
                  {mutualFriends.map(friend => (
                    <Avatar
                      key={friend.id}
                      src={friend.avatar_url}
                      name={friend.name || 'User'}
                      size="sm"
                      className="ring-2 ring-white"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Connect Action Buttons */}
            <div className="flex gap-3">
              {friendshipStatus === 'none' && (
                <Button
                  className="flex-1"
                  onClick={handleSendFriendRequest}
                  disabled={actionLoading}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {actionLoading ? 'Sending...' : 'Connect'}
                </Button>
              )}

              {friendshipStatus === 'pending_sent' && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelRequest}
                  disabled={actionLoading}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {actionLoading ? 'Cancelling...' : 'Request Sent'}
                </Button>
              )}

              {friendshipStatus === 'pending_received' && (
                <>
                  <Button
                    className="flex-1"
                    onClick={handleAcceptRequest}
                    disabled={actionLoading}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRejectRequest}
                    disabled={actionLoading}
                  >
                    Decline
                  </Button>
                </>
              )}

              {friendshipStatus === 'friends' && (
                <>
                  <Button variant="secondary" className="flex-1">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Friends
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleRemoveFriend}
                    disabled={actionLoading}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="mt-6 pt-6 border-t border-dark-border">
                <p className="text-sm text-neutral-500 mb-3">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map(interest => (
                    <Badge key={interest} variant="primary" size="sm">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Content Tabs */}
        <div className="max-w-2xl mx-auto px-4 mt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)}>
            <TabsList>
              <TabsTrigger value="posts">
                <Grid3X3 className="w-4 h-4 mr-1.5" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="hangouts">
                <Calendar className="w-4 h-4 mr-1.5" />
                Hangouts
              </TabsTrigger>
              <TabsTrigger value="communities">
                <Home className="w-4 h-4 mr-1.5" />
                Communities
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4">
              {/* Wall Post - only for friends */}
              {friendshipStatus === 'friends' && (
                <div className="mb-4">
                  <WallPost
                    targetUserId={userId}
                    targetUserName={profile.name || 'User'}
                    onPostCreated={fetchProfile}
                  />
                </div>
              )}

              {posts.length === 0 ? (
                <EmptyState
                  icon={Grid3X3}
                  title="No posts to show"
                  description={
                    friendshipStatus === 'friends'
                      ? "This user hasn't posted anything yet"
                      : "Add this user as a friend to see their posts"
                  }
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
                      <PostCard post={post} onReaction={fetchProfile} />
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
                  description="This user hasn't hosted any hangouts yet"
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
                      <HangoutCard hangout={hangout} onRsvpChange={fetchProfile} />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="communities" className="mt-4">
              {communities.length === 0 ? (
                <EmptyState
                  icon={Home}
                  title="No communities"
                  description="This user hasn't joined any communities yet"
                />
              ) : (
                <div className="grid gap-4">
                  {communities.map((community, index) => (
                    <motion.div
                      key={community.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link href={`/communities/${community.id}`}>
                        <Card className="p-4 hover:shadow-soft-lg transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                              <Home className="w-8 h-8 text-primary-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-neutral-100">{community.name}</h3>
                              {community.location && (
                                <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {community.location.address}
                                </p>
                              )}
                              <p className="text-sm text-neutral-400 mt-1">
                                {community.member_count} {pluralize(community.member_count, 'member')}
                              </p>
                            </div>
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
      </main>

    </AppShell>
  )
}
