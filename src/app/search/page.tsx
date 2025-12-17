'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Users,
  Home,
  GraduationCap,
  Building2,
  Calendar,
  MapPin,
  X,
  UserPlus,
  Check,
  Clock,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Avatar, Button, Card, Badge } from '@/components/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LoadingCard, LoadingScreen } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { User, Community, Hangout } from '@/types/database'
import { cn, pluralize, communityTypeConfig } from '@/utils/helpers'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

type SearchTab = 'all' | 'people' | 'communities' | 'hangouts'

const typeIcons = {
  society: Home,
  campus: GraduationCap,
  office: Building2,
}

function SearchContent() {
  const { user } = useAuth()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState<SearchTab>('all')
  const [people, setPeople] = useState<User[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [hangouts, setHangouts] = useState<Hangout[]>([])
  const [friendships, setFriendships] = useState<Record<string, string>>({})
  const [memberships, setMemberships] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const fetchFriendships = useCallback(async () => {
    if (!user) return
    
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    const friendshipMap: Record<string, string> = {}
    ;((data || []) as any[]).forEach((f: any) => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
      if (f.status === 'accepted') {
        friendshipMap[otherId] = 'friends'
      } else if (f.status === 'pending') {
        friendshipMap[otherId] = f.requester_id === user.id ? 'pending_sent' : 'pending_received'
      }
    })
    setFriendships(friendshipMap)
  }, [user, supabase])

  const fetchMemberships = useCallback(async () => {
    if (!user) return
    
    const { data } = await supabase
      .from('community_memberships')
      .select('*')
      .eq('user_id', user.id)

    const membershipMap: Record<string, string> = {}
    ;((data || []) as any[]).forEach((m: any) => {
      membershipMap[m.community_id] = m.status
    })
    setMemberships(membershipMap)
  }, [user, supabase])

  const handleSearch = useCallback(async () => {
    if (!user || !searchQuery.trim()) {
      setPeople([])
      setCommunities([])
      setHangouts([])
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      // Search people
      const { data: peopleData } = await supabase
        .from('users')
        .select('*')
        .neq('id', user.id)
        .ilike('name', `%${searchQuery}%`)
        .limit(20)

      setPeople((peopleData || []) as User[])

      // Search communities
      const { data: communitiesData } = await supabase
        .from('communities')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(20)

      setCommunities((communitiesData || []) as Community[])

      // Search hangouts
      const { data: hangoutsData } = await supabase
        .from('hangouts')
        .select('*, host:users!host_id(*), community:communities!community_id(*)')
        .gte('date_time', new Date().toISOString())
        .eq('status', 'upcoming')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(20)

      setHangouts((hangoutsData || []) as any[])

      await fetchFriendships()
      await fetchMemberships()
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed')
    } finally {
      setIsLoading(false)
    }
  }, [user, searchQuery, supabase, fetchFriendships, fetchMemberships])

  useEffect(() => {
    if (initialQuery) {
      handleSearch()
    }
  }, []) // eslint-disable-line

  const handleSendFriendRequest = async (userId: string) => {
    if (!user) return

    try {
      await (supabase.from('friendships') as any).insert({
        requester_id: user.id,
        addressee_id: userId,
        status: 'pending',
      })

      toast.success('Friend request sent!')
      fetchFriendships()
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error('Failed to send request')
    }
  }

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) return

    try {
      await (supabase.from('community_memberships') as any).insert({
        user_id: user.id,
        community_id: communityId,
        status: 'pending',
        role: 'member',
      })

      toast.success('Join request sent!')
      fetchMemberships()
    } catch (error) {
      console.error('Error joining community:', error)
      toast.error('Failed to join')
    }
  }

  const totalResults = people.length + communities.length + hangouts.length

  const renderPeopleResults = () => {
    if (people.length === 0) {
      return <EmptyState icon={Users} title="No people found" description="Try a different search term" />
    }

    return (
      <div className="space-y-3">
        {people.map((person, index) => {
          const friendStatus = friendships[person.id]
          
          return (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <Link href={`/profile/${person.id}`}>
                    <Avatar
                      src={person.avatar_url}
                      name={person.name || 'User'}
                      size="md"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${person.id}`}>
                      <h3 className="font-semibold text-neutral-100 hover:text-primary-400 transition-colors">
                        {person.name}
                      </h3>
                    </Link>
                    {person.bio && (
                      <p className="text-sm text-neutral-500 truncate">{person.bio}</p>
                    )}
                  </div>
                  {friendStatus === 'friends' ? (
                    <Badge variant="success" size="sm">
                      <Check className="w-3 h-3 mr-1" />
                      Friends
                    </Badge>
                  ) : friendStatus === 'pending_sent' ? (
                    <Badge variant="warning" size="sm">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  ) : friendStatus === 'pending_received' ? (
                    <Button size="sm" onClick={() => handleSendFriendRequest(person.id)}>
                      Accept
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendFriendRequest(person.id)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    )
  }

  const renderCommunitiesResults = () => {
    if (communities.length === 0) {
      return <EmptyState icon={Home} title="No communities found" description="Try a different search term" />
    }

    return (
      <div className="space-y-3">
        {communities.map((community, index) => {
          const TypeIcon = typeIcons[community.type]
          const membership = memberships[community.id]
          const typeConfig = communityTypeConfig[community.type]

          return (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    community.type === 'society' && 'bg-tertiary-100 text-tertiary-600',
                    community.type === 'campus' && 'bg-primary-100 text-primary-400',
                    community.type === 'office' && 'bg-secondary-100 text-secondary-600',
                  )}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/communities/${community.id}`}>
                      <h3 className="font-semibold text-neutral-100 hover:text-primary-400 transition-colors">
                        {community.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                      <span>{typeConfig.label}</span>
                      <span>•</span>
                      <span>{community.member_count} {pluralize(community.member_count, 'member')}</span>
                    </div>
                  </div>
                  {membership === 'approved' ? (
                    <Badge variant="success" size="sm">
                      <Check className="w-3 h-3 mr-1" />
                      Member
                    </Badge>
                  ) : membership === 'pending' ? (
                    <Badge variant="warning" size="sm">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleJoinCommunity(community.id)}
                    >
                      Join
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    )
  }

  const renderHangoutsResults = () => {
    if (hangouts.length === 0) {
      return <EmptyState icon={Calendar} title="No hangouts found" description="Try a different search term" />
    }

    return (
      <div className="space-y-3">
        {hangouts.map((hangout: any, index) => {
          const date = new Date(hangout.date_time)
          
          return (
            <motion.div
              key={hangout.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link href={`/hangouts/${hangout.id}`}>
                <Card className="p-4 hover:shadow-soft-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex flex-col items-center justify-center text-primary-400">
                      <span className="text-xs font-medium uppercase">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-100">{hangout.title}</h3>
                      <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {hangout.location?.name || 'TBD'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar
                          src={hangout.host?.avatar_url}
                          name={hangout.host?.name || 'Host'}
                          size="xs"
                        />
                        <span className="text-sm text-neutral-500">
                          Hosted by {hangout.host?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>
    )
  }

  const renderAllResults = () => {
    if (totalResults === 0) {
      return <EmptyState icon={Search} title="No results found" description="Try a different search term" />
    }

    return (
      <div className="space-y-6">
        {people.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-neutral-100">People</h2>
              {people.length > 3 && (
                <button
                  onClick={() => setActiveTab('people')}
                  className="text-sm text-primary-400 hover:text-primary-700"
                >
                  See all
                </button>
              )}
            </div>
            {renderPeopleResults()}
          </section>
        )}

        {communities.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-neutral-100">Communities</h2>
              {communities.length > 3 && (
                <button
                  onClick={() => setActiveTab('communities')}
                  className="text-sm text-primary-400 hover:text-primary-700"
                >
                  See all
                </button>
              )}
            </div>
            {renderCommunitiesResults()}
          </section>
        )}

        {hangouts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-neutral-100">Hangouts</h2>
              {hangouts.length > 3 && (
                <button
                  onClick={() => setActiveTab('hangouts')}
                  className="text-sm text-primary-400 hover:text-primary-700"
                >
                  See all
                </button>
              )}
            </div>
            {renderHangoutsResults()}
          </section>
        )}
      </div>
    )
  }

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search people, communities, hangouts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-12 py-3 bg-dark-card rounded-xl border border-dark-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setPeople([])
                    setCommunities([])
                    setHangouts([])
                    setHasSearched(false)
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex justify-end mt-2">
              <Button onClick={handleSearch} disabled={!searchQuery.trim() || isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Results */}
          {!hasSearched ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">Enter a search term to find people, communities, or hangouts</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SearchTab)}>
              <TabsList>
                <TabsTrigger value="all">
                  All ({totalResults})
                </TabsTrigger>
                <TabsTrigger value="people">
                  <Users className="w-4 h-4 mr-1.5" />
                  People ({people.length})
                </TabsTrigger>
                <TabsTrigger value="communities">
                  <Home className="w-4 h-4 mr-1.5" />
                  Communities ({communities.length})
                </TabsTrigger>
                <TabsTrigger value="hangouts">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Hangouts ({hangouts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {renderAllResults()}
              </TabsContent>

              <TabsContent value="people" className="mt-4">
                {renderPeopleResults()}
              </TabsContent>

              <TabsContent value="communities" className="mt-4">
                {renderCommunitiesResults()}
              </TabsContent>

              <TabsContent value="hangouts" className="mt-4">
                {renderHangoutsResults()}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

    </AppShell>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SearchContent />
    </Suspense>
  )
}
