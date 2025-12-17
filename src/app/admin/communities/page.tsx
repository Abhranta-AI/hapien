'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Building2,
  GraduationCap,
  Home,
  Check,
  X,
  Clock,
  MapPin,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Button, Card, Badge } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { cn } from '@/utils/helpers'

type CommunityRequest = {
  id: string
  requested_by: string
  name: string
  type: 'society' | 'campus' | 'office'
  location: string
  description: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  requester?: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }
}

const COMMUNITY_TYPE_ICONS = {
  society: Home,
  campus: GraduationCap,
  office: Building2,
}

const COMMUNITY_TYPE_LABELS = {
  society: 'Residential Society',
  campus: 'College Campus',
  office: 'Office Complex',
}

export default function AdminCommunitiesPage() {
  const router = useRouter()
  const { user, authUser, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [requests, setRequests] = useState<CommunityRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  // Check if user is admin
  const isAdmin = user?.is_admin === true


  useEffect(() => {
    fetchRequests()
  }, [filterStatus])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      let query = (supabase
        .from('community_requests') as any)
        .select(`
          *,
          requester:users!requested_by (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error

      setRequests((data || []) as CommunityRequest[])
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to load requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (request: CommunityRequest) => {
    if (!confirm(`Approve community "${request.name}"?`)) return

    setProcessingId(request.id)

    try {
      // 1. Create the community
      const { data: community, error: communityError } = await (supabase
        .from('communities') as any)
        .insert({
          name: request.name,
          type: request.type,
          location: request.location,
          description: request.description,
          created_by: request.requested_by,
        })
        .select()
        .single()

      if (communityError) throw communityError

      // 2. Add requester as admin member
      const { error: memberError } = await (supabase
        .from('community_memberships') as any)
        .insert({
          user_id: request.requested_by,
          community_id: community.id,
          role: 'admin',
          status: 'approved',
        })

      if (memberError) throw memberError

      // 3. Update request status
      const { error: updateError } = await (supabase
        .from('community_requests') as any)
        .update({
          status: 'approved',
          admin_notes: `Approved and created community: ${community.id}`,
        })
        .eq('id', request.id)

      if (updateError) throw updateError

      toast.success(`Community "${request.name}" approved!`)
      fetchRequests()
    } catch (error) {
      console.error('Error approving request:', error)
      toast.error('Failed to approve request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (request: CommunityRequest) => {
    const reason = prompt(`Reject "${request.name}"? Enter reason (optional):`)
    if (reason === null) return // User cancelled

    setProcessingId(request.id)

    try {
      const { error } = await (supabase
        .from('community_requests') as any)
        .update({
          status: 'rejected',
          admin_notes: reason || 'Rejected by admin',
        })
        .eq('id', request.id)

      if (error) throw error

      toast.success('Request rejected')
      fetchRequests()
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Failed to reject request')
    } finally {
      setProcessingId(null)
    }
  }

  if (authLoading) {
    return <LoadingScreen />
  }

    if (!authUser) {
    router.push('/auth/login')
    return <LoadingScreen />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-100 mb-2">
            Access Denied
          </h1>
          <p className="text-neutral-400 mb-6">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => router.push('/feed')}>
            Go to Feed
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-neutral-100 mb-2">
              Community Requests
            </h1>
            <p className="text-neutral-400">
              Review and approve community creation requests
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap',
                  filterStatus === status
                    ? 'bg-primary-500 text-white shadow-glow'
                    : 'bg-dark-card text-neutral-400 hover:text-neutral-200 border border-dark-border'
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Requests List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-dark-hover rounded w-1/3 mb-4" />
                  <div className="h-4 bg-dark-hover rounded w-2/3 mb-2" />
                  <div className="h-4 bg-dark-hover rounded w-1/2" />
                </Card>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-300 mb-2">
                No {filterStatus !== 'all' && filterStatus} requests
              </h3>
              <p className="text-neutral-500">
                {filterStatus === 'pending'
                  ? 'All caught up! No pending requests to review.'
                  : 'No requests found with this status.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const Icon = COMMUNITY_TYPE_ICONS[request.type]
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-primary-400" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-neutral-100 truncate">
                                {request.name}
                              </h3>
                              <Badge
                                variant={
                                  request.status === 'pending'
                                    ? 'warning'
                                    : request.status === 'approved'
                                    ? 'success'
                                    : 'default'
                                }
                              >
                                {request.status}
                              </Badge>
                            </div>

                            <p className="text-sm text-neutral-400 mb-2">
                              {COMMUNITY_TYPE_LABELS[request.type]}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-neutral-500 mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {request.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {request.requester?.name || 'Unknown User'}
                              </div>
                            </div>

                            {request.description && (
                              <p className="text-sm text-neutral-400 mb-3">
                                {request.description}
                              </p>
                            )}

                            {request.admin_notes && (
                              <div className="bg-dark-hover rounded-lg p-3 text-sm text-neutral-400">
                                <span className="font-medium">Admin notes:</span>{' '}
                                {request.admin_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleReject(request)}
                            disabled={processingId === request.id}
                            leftIcon={<X className="w-4 h-4" />}
                          >
                            Reject
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => handleApprove(request)}
                            isLoading={processingId === request.id}
                            leftIcon={<Check className="w-4 h-4" />}
                          >
                            Approve
                          </Button>
                        </div>
                      )}

                      <div className="text-xs text-neutral-600 mt-3">
                        Requested {new Date(request.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </main>

    </AppShell>
  )
}
