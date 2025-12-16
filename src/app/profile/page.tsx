'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Settings,
  Edit2,
  Users,
  Home,
  Calendar,
  Grid3X3,
  List,
  UserPlus,
  LogOut,
  MapPin,
} from 'lucide-react'
import { AppShell, Header, BottomNav } from '@/components/layout'
import { Avatar, Button, Card, Badge } from '@/components/ui'
import { PostCard, CreatePost } from '@/components/feed'
import { HangoutCard } from '@/components/hangouts/HangoutCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LoadingScreen, PostCardSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { 
  User, 
  Community, 
  PostWithRelations, 
  HangoutWithRelations 
} from '@/types/database'
import { cn, pluralize } from '@/utils/helpers'
import toast from 'react-hot-toast'

type ProfileTab = 'posts' | 'hangouts' | 'communities'

export default function ProfilePage() {
  const { authUser, user, signOut, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [hangouts, setHangouts] = useState<HangoutWithRelations[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [friendsCount, setFriendsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchProfile = useCallback(async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData as User | null)

      // Fetch friends count
      const { count: friendCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      setFriendsCount(friendCount || 0)

      // Fetch user's posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!user_id(*),
          community:communities!community_id(*),
          reactions(*),
          comments(count)
        `)
        .eq('user_id', user.id)
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

      // Fetch user's hangouts
      const { data: hangoutsData } = await supabase
        .from('hangouts')
        .select(`
          *,
          host:users!host_id(*),
          community:communities!community_id(*),
          rsvps:hangout_rsvps(*, user:users!user_id(*))
        `)
        .eq('host_id', user.id)
        .order('date_time', { ascending: false })
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
        .eq('user_id', user.id)
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
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile, refreshKey])

  const handlePostCreated = () => {
    setRefreshKey(k => k + 1)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  // Redirect logic - handle auth states properly
  useEffect(() => {
    if (authLoading) return

    // Not logged in - redirect to login
    if (!authUser) {
      router.push('/auth/login')
      return
    }

    // Logged in but no profile or incomplete profile - redirect to onboarding
    if (!user?.name) {
      router.push('/onboarding')
      return
    }
  }, [authLoading, authUser, user, router])

  if (authLoading) {
    return <LoadingScreen />
  }

  // Show loading while redirect is happening
  if (!authUser || !user?.name) {
    return <LoadingScreen message="Redirecting..." />
  }

  if (!profile) {
    return <LoadingScreen message="Loading profile..." />
  }

  return (
    <AppShell>
      <Header />

      <main className="min-h-screen pt-16 pb-24 bg-gradient-to-b from-primary-50/30 via-white to-white">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 pt-8 pb-20 px-4">
          <div className="max-w-2xl mx-auto">
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
              <div className="flex gap-2">
                <Link href="/profile/edit">
                  <Button variant="secondary" size="sm">
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="max-w-2xl mx-auto px-4 -mt-12">
          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-around">
              <Link href="/friends" className="text-center hover:opacity-80 transition-opacity">
                <p className="text-2xl font-bold text-neutral-100">{friendsCount}</p>
                <p className="text-sm text-neutral-500">{pluralize(friendsCount, 'Friend')}</p>
              </Link>
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
              {/* Create Post on Wall */}
              <div className="mb-4">
                <CreatePost onPostCreated={handlePostCreated} />
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <EmptyState
                  icon={Grid3X3}
                  title="No posts yet"
                  description="Share your first post with friends!"
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
                      <PostCard post={post} onReaction={handlePostCreated} />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="hangouts" className="mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              ) : hangouts.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No hangouts yet"
                  description="Host your first hangout!"
                  action={{ label: "Create Hangout", href: "/hangouts/create" }}
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
                      <HangoutCard hangout={hangout} onRsvpChange={handlePostCreated} />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="communities" className="mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              ) : communities.length === 0 ? (
                <EmptyState
                  icon={Home}
                  title="No communities yet"
                  description="Join a community to connect with neighbors!"
                  action={{ label: "Browse Communities", href: "/communities" }}
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

      <BottomNav />
    </AppShell>
  )
}
