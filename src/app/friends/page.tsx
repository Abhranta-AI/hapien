'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Users,
  ArrowLeft,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Avatar, Button, Card, Input } from '@/components/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LoadingScreen, LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { User, Friendship } from '@/types/database'
import toast from 'react-hot-toast'

type ConnectsTab = 'connects' | 'requests' | 'sent' | 'discover'

type ConnectWithUser = {
  friendship: Friendship
  user: User
}

export default function ConnectsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<ConnectsTab>('connects')
  const [searchQuery, setSearchQuery] = useState('')
  const [connects, setConnects] = useState<ConnectWithUser[]>([])
  const [pendingReceived, setPendingReceived] = useState<ConnectWithUser[]>([])
  const [pendingSent, setPendingSent] = useState<ConnectWithUser[]>([])
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchConnects = useCallback(async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // Fetch all friendships involving user
      const { data: friendshipsData, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      if (error) throw error

      const friendships = (friendshipsData || []) as Friendship[]

      // Collect all user IDs we need to fetch
      const userIds = new Set<string>()
      friendships.forEach(f => {
        if (f.requester_id !== user.id) userIds.add(f.requester_id)
        if (f.addressee_id !== user.id) userIds.add(f.addressee_id)
      })

      // Fetch all users
      let usersMap: Record<string, User> = {}
      if (userIds.size > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .in('id', Array.from(userIds))

        ;((usersData || []) as User[]).forEach(u => {
          usersMap[u.id] = u
        })
      }

      // Categorize friendships
      const connectsList: ConnectWithUser[] = []
      const receivedList: ConnectWithUser[] = []
      const sentList: ConnectWithUser[] = []

      friendships.forEach(f => {
        const otherUserId = f.requester_id === user.id ? f.addressee_id : f.requester_id
        const otherUser = usersMap[otherUserId]
        if (!otherUser) return

        const item = { friendship: f, user: otherUser }

        if (f.status === 'accepted') {
          connectsList.push(item)
        } else if (f.status === 'pending') {
          if (f.addressee_id === user.id) {
            receivedList.push(item)
          } else {
            sentList.push(item)
          }
        }
      })

      setConnects(connectsList)
      setPendingReceived(receivedList)
      setPendingSent(sentList)

      // Fetch connect suggestions (users in same communities who aren't connects)
      const { data: memberships } = await supabase
        .from('community_memberships')
        .select('community_id')
        .eq('user_id', user.id)
        .eq('status', 'approved')

      if (memberships && memberships.length > 0) {
        const communityIds = (memberships as any[]).map(m => m.community_id)

        // Get users in same communities
        const { data: communityMembers } = await supabase
          .from('community_memberships')
          .select('user_id')
          .in('community_id', communityIds)
          .eq('status', 'approved')
          .neq('user_id', user.id)

        if (communityMembers) {
          const memberIds = Array.from(new Set((communityMembers as any[]).map(m => m.user_id)))
          
          // Filter out existing connects and pending requests
          const existingIds = new Set(friendships.map(f => 
            f.requester_id === user.id ? f.addressee_id : f.requester_id
          ))
          
          const suggestionIds = memberIds.filter(id => !existingIds.has(id)).slice(0, 10)

          if (suggestionIds.length > 0) {
            const { data: suggestionUsers } = await supabase
              .from('users')
              .select('*')
              .in('id', suggestionIds)

            setSuggestions((suggestionUsers || []) as User[])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching connects:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchConnects()
  }, [fetchConnects])

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!user || !searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .neq('id', user.id)
          .ilike('name', `%${searchQuery}%`)
          .limit(10)

        setSearchResults((data || []) as User[])
      } catch (error) {
        console.error('Error searching users:', error)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, user, supabase])

  const handleAcceptRequest = async (friendshipId: string) => {
    setActionLoading(friendshipId)
    try {
      const { error } = await (supabase
        .from('friendships') as any)
        .update({ status: 'accepted' })
        .eq('id', friendshipId)

      if (error) throw error

      toast.success('Connect request accepted!')
      fetchConnects()
    } catch (error) {
      console.error('Error accepting request:', error)
      toast.error('Failed to accept request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectRequest = async (friendshipId: string) => {
    setActionLoading(friendshipId)
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (error) throw error

      toast.success('Connect request declined')
      fetchConnects()
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Failed to decline request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelRequest = async (friendshipId: string) => {
    setActionLoading(friendshipId)
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (error) throw error

      toast.success('Connect request cancelled')
      fetchConnects()
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast.error('Failed to cancel request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveConnect = async (friendshipId: string) => {
    setActionLoading(friendshipId)
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (error) throw error

      toast.success('Connect removed')
      fetchConnects()
    } catch (error) {
      console.error('Error removing connect:', error)
      toast.error('Failed to remove connect')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendRequest = async (targetUserId: string) => {
    if (!user) return

    setActionLoading(targetUserId)
    try {
      const { error } = await (supabase.from('friendships') as any).insert({
        requester_id: user.id,
        addressee_id: targetUserId,
        status: 'pending',
      })

      if (error) throw error

      toast.success('Connect request sent!')
      fetchConnects()
      setSearchResults(prev => prev.filter(u => u.id !== targetUserId))
      setSuggestions(prev => prev.filter(u => u.id !== targetUserId))
    } catch (error) {
      console.error('Error sending request:', error)
      toast.error('Failed to send request')
    } finally {
      setActionLoading(null)
    }
  }

  const isAlreadyConnect = (userId: string) => {
    return connects.some(f => f.user.id === userId)
  }

  const hasPendingRequest = (userId: string) => {
    return pendingSent.some(f => f.user.id === userId) || 
           pendingReceived.some(f => f.user.id === userId)
  }

  if (authLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return null
  }

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/profile"
              className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Profile
            </Link>
            <h1 className="text-2xl font-display font-bold text-neutral-100">
              Connects
            </h1>
            <p className="text-neutral-400 mt-1">
              Manage your connections
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search for connects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-card rounded-xl border border-dark-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className="mt-2 p-2 divide-y divide-neutral-100">
                {searchResults.map(searchUser => (
                  <div
                    key={searchUser.id}
                    className="flex items-center justify-between p-3"
                  >
                    <Link
                      href={`/profile/${searchUser.id}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Avatar
                        src={searchUser.avatar_url}
                        name={searchUser.name || 'User'}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-neutral-100">
                          {searchUser.name}
                        </p>
                        {searchUser.bio && (
                          <p className="text-sm text-neutral-500 line-clamp-1">
                            {searchUser.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                    {!isAlreadyConnect(searchUser.id) && !hasPendingRequest(searchUser.id) && (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(searchUser.id)}
                        disabled={actionLoading === searchUser.id}
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    )}
                    {isAlreadyConnect(searchUser.id) && (
                      <span className="text-sm text-primary-400 flex items-center gap-1">
                        <UserCheck className="w-4 h-4" />
                        Connects
                      </span>
                    )}
                    {hasPendingRequest(searchUser.id) && (
                      <span className="text-sm text-neutral-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ConnectsTab)}>
            <TabsList>
              <TabsTrigger value="connects">
                <Users className="w-4 h-4 mr-1.5" />
                Connects
                {connects.length > 0 && (
                  <span className="ml-1.5 text-xs bg-neutral-200 px-1.5 py-0.5 rounded-full">
                    {connects.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="requests">
                Requests
                {pendingReceived.length > 0 && (
                  <span className="ml-1.5 text-xs bg-primary-900/300 text-white px-1.5 py-0.5 rounded-full">
                    {pendingReceived.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent
                {pendingSent.length > 0 && (
                  <span className="ml-1.5 text-xs bg-neutral-200 px-1.5 py-0.5 rounded-full">
                    {pendingSent.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="discover">
                Discover
              </TabsTrigger>
            </TabsList>

            {/* Connects List */}
            <TabsContent value="connects" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <LoadingCard key={i} />
                  ))}
                </div>
              ) : connects.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No connects yet"
                  description="Start connecting with people from your communities!"
                  action={{ label: "Discover People", onClick: () => setActiveTab('discover') }}
                />
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {connects.map(({ friendship, user: connectUser }, index) => (
                      <motion.div
                        key={friendship.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-center gap-4">
                            <Link href={`/profile/${connectUser.id}`}>
                              <Avatar
                                src={connectUser.avatar_url}
                                name={connectUser.name || 'User'}
                                size="lg"
                              />
                            </Link>
                            <Link
                              href={`/profile/${connectUser.id}`}
                              className="flex-1"
                            >
                              <h3 className="font-semibold text-neutral-100 hover:text-primary-400 transition-colors">
                                {connectUser.name}
                              </h3>
                              {connectUser.bio && (
                                <p className="text-sm text-neutral-500 line-clamp-1">
                                  {connectUser.bio}
                                </p>
                              )}
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveConnect(friendship.id)}
                              disabled={actionLoading === friendship.id}
                            >
                              <UserX className="w-4 h-4 text-neutral-400" />
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </TabsContent>

            {/* Pending Requests (Received) */}
            <TabsContent value="requests" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <LoadingCard key={i} />
                  ))}
                </div>
              ) : pendingReceived.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No pending requests"
                  description="When someone sends you a connect request, it will appear here"
                />
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {pendingReceived.map(({ friendship, user: requestUser }, index) => (
                      <motion.div
                        key={friendship.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-center gap-4">
                            <Link href={`/profile/${requestUser.id}`}>
                              <Avatar
                                src={requestUser.avatar_url}
                                name={requestUser.name || 'User'}
                                size="lg"
                              />
                            </Link>
                            <Link
                              href={`/profile/${requestUser.id}`}
                              className="flex-1"
                            >
                              <h3 className="font-semibold text-neutral-100 hover:text-primary-400 transition-colors">
                                {requestUser.name}
                              </h3>
                              {requestUser.bio && (
                                <p className="text-sm text-neutral-500 line-clamp-1">
                                  {requestUser.bio}
                                </p>
                              )}
                            </Link>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptRequest(friendship.id)}
                                disabled={actionLoading === friendship.id}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectRequest(friendship.id)}
                                disabled={actionLoading === friendship.id}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </TabsContent>

            {/* Sent Requests */}
            <TabsContent value="sent" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <LoadingCard key={i} />
                  ))}
                </div>
              ) : pendingSent.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No sent requests"
                  description="Connect requests you send will appear here until they're accepted"
                />
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {pendingSent.map(({ friendship, user: targetUser }, index) => (
                      <motion.div
                        key={friendship.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-center gap-4">
                            <Link href={`/profile/${targetUser.id}`}>
                              <Avatar
                                src={targetUser.avatar_url}
                                name={targetUser.name || 'User'}
                                size="lg"
                              />
                            </Link>
                            <Link
                              href={`/profile/${targetUser.id}`}
                              className="flex-1"
                            >
                              <h3 className="font-semibold text-neutral-100 hover:text-primary-400 transition-colors">
                                {targetUser.name}
                              </h3>
                              <p className="text-sm text-neutral-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Request pending
                              </p>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelRequest(friendship.id)}
                              disabled={actionLoading === friendship.id}
                            >
                              Cancel
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </TabsContent>

            {/* Discover / Suggestions */}
            <TabsContent value="discover" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <LoadingCard key={i} />
                  ))}
                </div>
              ) : suggestions.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No suggestions yet"
                  description="Join communities to discover people with similar interests"
                  action={{ label: "Browse Communities", href: "/communities" }}
                />
              ) : (
                <div>
                  <p className="text-sm text-neutral-500 mb-4">
                    People from your communities
                  </p>
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="p-4">
                            <div className="flex items-center gap-4">
                              <Link href={`/profile/${suggestion.id}`}>
                                <Avatar
                                  src={suggestion.avatar_url}
                                  name={suggestion.name || 'User'}
                                  size="lg"
                                />
                              </Link>
                              <Link
                                href={`/profile/${suggestion.id}`}
                                className="flex-1"
                              >
                                <h3 className="font-semibold text-neutral-100 hover:text-primary-400 transition-colors">
                                  {suggestion.name}
                                </h3>
                                {suggestion.bio && (
                                  <p className="text-sm text-neutral-500 line-clamp-1">
                                    {suggestion.bio}
                                  </p>
                                )}
                              </Link>
                              <Button
                                size="sm"
                                onClick={() => handleSendRequest(suggestion.id)}
                                disabled={actionLoading === suggestion.id}
                              >
                                <UserPlus className="w-4 h-4 mr-1.5" />
                                Add
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

    </AppShell>
  )
}
