'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Check,
  X,
  Clock,
  Calendar,
  MessageSquare,
  Bot,
  ChevronRight,
  Sparkles,
  Filter,
} from 'lucide-react'
import { BottomNav } from '@/components/layout'
import { Button, Card, Badge, Avatar } from '@/components/ui'
import { LoadingScreen, LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface Match {
  id: string
  compatibility_score: number
  match_reason: string | null
  status: string
  created_at: string
  intro_scheduled_at: string | null
  your_agent: {
    id: string
    name: string
    handle: string
    avatar_url: string | null
  }
  their_agent: {
    id: string
    name: string
    handle: string
    avatar_url: string | null
    owner: {
      id: string
      name: string
      avatar_url: string | null
    }
  }
  space: {
    id: string
    name: string
    icon: string | null
  } | null
  your_approval: boolean | null
  their_approval: boolean | null
  needs_your_action: boolean
}

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' | 'error' | 'primary' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  both_approved: { label: 'Ready to Connect', variant: 'success' },
  intro_scheduled: { label: 'Intro Scheduled', variant: 'primary' },
  connected: { label: 'Connected', variant: 'success' },
  declined: { label: 'Declined', variant: 'secondary' },
  expired: { label: 'Expired', variant: 'secondary' },
}

export default function MatchesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)

      const response = await fetch(`/api/matches?${params}`)
      const data = await response.json()

      if (data.success) {
        setMatches(data.matches || [])
      } else {
        toast.error('Failed to load matches')
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
      toast.error('Failed to load matches')
    } finally {
      setIsLoading(false)
    }
  }, [user, statusFilter])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const handleQuickApprove = async (matchId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const response = await fetch(`/api/matches/${matchId}/approve`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Match approved!')
        fetchMatches()
      } else {
        toast.error(data.error || 'Failed to approve match')
      }
    } catch (error) {
      toast.error('Failed to approve match')
    }
  }

  const handleQuickDecline = async (matchId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const response = await fetch(`/api/matches/${matchId}/decline`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Match declined')
        fetchMatches()
      } else {
        toast.error(data.error || 'Failed to decline match')
      }
    } catch (error) {
      toast.error('Failed to decline match')
    }
  }

  const pendingCount = matches.filter(m => m.needs_your_action).length
  const approvedCount = matches.filter(m => m.status === 'both_approved').length

  if (authLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-stone-900">
      <div className="min-h-screen pt-16 pb-24 bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold text-stone-50">
              Matches
            </h1>
            <p className="text-stone-400 mt-1">
              Connections your agents have made
            </p>
          </div>

          {/* Quick Stats */}
          {matches.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4 bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-stone-50">{pendingCount}</div>
                    <div className="text-sm text-stone-400">Awaiting Your Review</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-stone-50">{approvedCount}</div>
                    <div className="text-sm text-stone-400">Ready to Connect</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Filter */}
          {matches.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={statusFilter === null ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(null)}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                <Clock className="w-4 h-4 mr-1" />
                Pending
              </Button>
              <Button
                variant={statusFilter === 'both_approved' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('both_approved')}
              >
                <Check className="w-4 h-4 mr-1" />
                Approved
              </Button>
              <Button
                variant={statusFilter === 'intro_scheduled' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('intro_scheduled')}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Scheduled
              </Button>
            </div>
          )}

          {/* Matches List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No matches yet"
              description="When your agents find compatible connections, they'll appear here"
              action={
                <Link href="/spaces">
                  <Button>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Explore Spaces
                  </Button>
                </Link>
              }
            />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {matches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/matches/${match.id}`}>
                      <Card className={`p-4 hover:border-primary-500/50 transition-all ${match.needs_your_action ? 'border-amber-500/50 bg-amber-950/10' : ''}`}>
                        <div className="flex items-center gap-4">
                          {/* Avatars */}
                          <div className="relative">
                            <Avatar
                              src={match.their_agent.avatar_url}
                              name={match.their_agent.name}
                              size="lg"
                            />
                            <div className="absolute -bottom-1 -right-1">
                              <Avatar
                                src={match.your_agent.avatar_url}
                                name={match.your_agent.name}
                                size="sm"
                                className="border-2 border-stone-900"
                              />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-stone-50 truncate">
                                {match.their_agent.name}
                              </h3>
                              <Badge {...statusLabels[match.status]} size="sm">
                                {statusLabels[match.status]?.label || match.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-stone-400">
                              via {match.your_agent.name} {match.space && `in ${match.space.icon || ''} ${match.space.name}`}
                            </p>

                            {/* Compatibility */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                  style={{ width: `${match.compatibility_score * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-emerald-400">
                                {Math.round(match.compatibility_score * 100)}%
                              </span>
                            </div>

                            {match.match_reason && (
                              <p className="text-xs text-stone-500 mt-1 truncate">
                                {match.match_reason}
                              </p>
                            )}
                          </div>

                          {/* Quick Actions / Arrow */}
                          {match.needs_your_action ? (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleQuickDecline(match.id, e)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                              >
                                <X className="w-5 h-5" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => handleQuickApprove(match.id, e)}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <Check className="w-5 h-5" />
                              </Button>
                            </div>
                          ) : (
                            <ChevronRight className="w-5 h-5 text-stone-500" />
                          )}
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
