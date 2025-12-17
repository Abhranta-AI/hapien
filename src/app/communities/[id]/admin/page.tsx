'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  Check,
  X,
  Clock,
  Shield,
  Search,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Avatar, Button, Card, Badge } from '@/components/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LoadingScreen, LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Community, CommunityMembership, User } from '@/types/database'
import toast from 'react-hot-toast'

interface CommunityAdminPageProps {
  params: Promise<{ id: string }>
}

interface MemberWithUser {
  id: string
  user_id: string
  community_id: string
  status: string
  role: string
  created_at: string
  user: User
}

type AdminTab = 'members' | 'pending'

export default function CommunityAdminPage({ params }: CommunityAdminPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [community, setCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<MemberWithUser[]>([])
  const [pendingRequests, setPendingRequests] = useState<MemberWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('members')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id || !user) return

    setIsLoading(true)

    try {
      // Fetch community
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single()

      if (communityError) throw communityError

      setCommunity(communityData as Community)

      // Check if current user is admin
      const { data: userMembership } = await supabase
        .from('community_memberships')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .single()

      const isUserAdmin = (userMembership as any)?.role === 'admin'
      setIsAdmin(isUserAdmin)

      if (!isUserAdmin) {
        toast.error('You must be an admin to access this page')
        router.push(`/communities/${id}`)
        return
      }

      // Fetch all memberships with user info
      const { data: membershipsData } = await supabase
        .from('community_memberships')
        .select(`
          *,
          user:users!user_id(*)
        `)
        .eq('community_id', id)
        .order('created_at', { ascending: false })

      const allMemberships = (membershipsData || []) as MemberWithUser[]
      
      setMembers(allMemberships.filter(m => m.status === 'approved'))
      setPendingRequests(allMemberships.filter(m => m.status === 'pending'))
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load community data')
      router.push('/communities')
    } finally {
      setIsLoading(false)
    }
  }, [id, user, supabase, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  const handleApprove = async (membershipId: string) => {
    setProcessingId(membershipId)

    try {
      const { error } = await (supabase
        .from('community_memberships') as any)
        .update({ status: 'approved' })
        .eq('id', membershipId)

      if (error) throw error

      toast.success('Member approved!')
      fetchData()
    } catch (error) {
      console.error('Error approving member:', error)
      toast.error('Failed to approve member')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (membershipId: string) => {
    if (!confirm('Are you sure you want to reject this request?')) return

    setProcessingId(membershipId)

    try {
      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('id', membershipId)

      if (error) throw error

      toast.success('Request rejected')
      fetchData()
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Failed to reject request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRemoveMember = async (membershipId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the community?`)) return

    setProcessingId(membershipId)

    try {
      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('id', membershipId)

      if (error) throw error

      toast.success('Member removed')
      fetchData()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    } finally {
      setProcessingId(null)
    }
  }

  const handleMakeAdmin = async (membershipId: string, memberName: string) => {
    if (!confirm(`Make ${memberName} an admin?`)) return

    setProcessingId(membershipId)

    try {
      const { error } = await (supabase
        .from('community_memberships') as any)
        .update({ role: 'admin' })
        .eq('id', membershipId)

      if (error) throw error

      toast.success(`${memberName} is now an admin`)
      fetchData()
    } catch (error) {
      console.error('Error making admin:', error)
      toast.error('Failed to make admin')
    } finally {
      setProcessingId(null)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!user || !community || !isAdmin) {
    return null
  }

  const filteredMembers = members.filter(m => 
    m.user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-primary-400" />
              <h1 className="text-2xl font-display font-bold text-neutral-100">
                Admin Panel
              </h1>
            </div>
            <p className="text-neutral-400">
              Managing <span className="font-medium">{community.name}</span>
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-100">{members.length}</p>
                  <p className="text-sm text-neutral-500">Members</p>
                </div>
              </div>
            </Card>
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Clock className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-100">{pendingRequests.length}</p>
                  <p className="text-sm text-neutral-500">Pending</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)}>
            <TabsList>
              <TabsTrigger value="members">
                <Users className="w-4 h-4 mr-1.5" />
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                <Clock className="w-4 h-4 mr-1.5" />
                Pending ({pendingRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-dark-card rounded-xl border border-dark-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {filteredMembers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No members found"
                  description={searchQuery ? "Try a different search term" : "No members in this community yet"}
                />
              ) : (
                <AnimatePresence>
                  <div className="space-y-3">
                    {filteredMembers.map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-center gap-4">
                            <Link href={`/profile/${member.user.id}`}>
                              <Avatar
                                src={member.user.avatar_url}
                                name={member.user.name || 'User'}
                                size="md"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link href={`/profile/${member.user.id}`}>
                                <p className="font-semibold text-neutral-100 hover:text-primary-400 transition-colors">
                                  {member.user.name}
                                </p>
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                {member.role === 'admin' && (
                                  <Badge variant="primary" size="sm">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Admin
                                  </Badge>
                                )}
                                <span className="text-sm text-neutral-500">
                                  Joined {new Date(member.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {member.user.id !== user.id && member.role !== 'admin' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMakeAdmin(member.id, member.user.name || 'User')}
                                  disabled={processingId === member.id}
                                >
                                  <Shield className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveMember(member.id, member.user.name || 'User')}
                                  disabled={processingId === member.id}
                                  className="text-tertiary-300 hover:bg-tertiary-900/30"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              {pendingRequests.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No pending requests"
                  description="All caught up! No join requests to review."
                />
              ) : (
                <AnimatePresence>
                  <div className="space-y-3">
                    {pendingRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-center gap-4">
                            <Link href={`/profile/${request.user.id}`}>
                              <Avatar
                                src={request.user.avatar_url}
                                name={request.user.name || 'User'}
                                size="md"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link href={`/profile/${request.user.id}`}>
                                <p className="font-semibold text-neutral-100 hover:text-primary-400 transition-colors">
                                  {request.user.name}
                                </p>
                              </Link>
                              <p className="text-sm text-neutral-500">
                                Requested {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(request.id)}
                                disabled={processingId === request.id}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(request.id)}
                                disabled={processingId === request.id}
                                className="text-tertiary-300 hover:bg-tertiary-900/30"
                              >
                                <X className="w-4 h-4" />
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
          </Tabs>
        </div>
      </main>

    </AppShell>
  )
}
