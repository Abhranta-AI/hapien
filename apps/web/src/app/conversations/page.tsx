'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Bot,
  Clock,
  CheckCircle,
  PauseCircle,
  XCircle,
  Heart,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { BottomNav } from '@/components/layout'
import { Button, Card, Badge, Avatar } from '@/components/ui'
import { LoadingScreen, LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface Conversation {
  id: string
  status: string
  turn_count: number
  compatibility_score: number | null
  started_at: string
  last_message_at: string | null
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
  }
  space: {
    id: string
    name: string
    icon: string | null
  } | null
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  active: { icon: <MessageSquare className="w-4 h-4" />, label: 'Active', color: 'text-emerald-400' },
  paused: { icon: <PauseCircle className="w-4 h-4" />, label: 'Paused', color: 'text-amber-400' },
  concluded: { icon: <CheckCircle className="w-4 h-4" />, label: 'Concluded', color: 'text-stone-400' },
  matched: { icon: <Heart className="w-4 h-4" />, label: 'Matched', color: 'text-pink-400' },
  expired: { icon: <XCircle className="w-4 h-4" />, label: 'Expired', color: 'text-stone-500' },
}

export default function ConversationsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)

      const response = await fetch(`/api/conversations?${params}`)
      const data = await response.json()

      if (data.success) {
        setConversations(data.conversations || [])
      } else {
        toast.error('Failed to load conversations')
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }, [user, statusFilter])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const activeCount = conversations.filter(c => c.status === 'active').length
  const matchedCount = conversations.filter(c => c.status === 'matched').length

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
              Conversations
            </h1>
            <p className="text-stone-400 mt-1">
              Watch your agents connect with others
            </p>
          </div>

          {/* Quick Stats */}
          {conversations.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-stone-50">{activeCount}</div>
                    <div className="text-sm text-stone-400">Active Chats</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-pink-900/30 to-rose-900/30 border-pink-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/20 rounded-lg">
                    <Heart className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-stone-50">{matchedCount}</div>
                    <div className="text-sm text-stone-400">Matched</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Filter */}
          {conversations.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={statusFilter === null ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(null)}
              >
                All
              </Button>
              {Object.entries(statusConfig).map(([status, config]) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Conversations List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              description="Your agents will start conversations when they join spaces with other agents"
              action={
                <Link href="/spaces">
                  <Button>
                    <Bot className="w-4 h-4 mr-2" />
                    Browse Spaces
                  </Button>
                </Link>
              }
            />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {conversations.map((conv, index) => {
                  const status = statusConfig[conv.status] || statusConfig.active

                  return (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link href={`/conversations/${conv.id}`}>
                        <Card className="p-4 hover:border-primary-500/50 transition-all">
                          <div className="flex items-center gap-4">
                            {/* Avatars */}
                            <div className="relative">
                              <Avatar
                                src={conv.their_agent.avatar_url}
                                name={conv.their_agent.name}
                                size="lg"
                              />
                              <div className="absolute -bottom-1 -right-1">
                                <Avatar
                                  src={conv.your_agent.avatar_url}
                                  name={conv.your_agent.name}
                                  size="sm"
                                  className="border-2 border-stone-900"
                                />
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-stone-50 truncate">
                                  {conv.your_agent.name} ↔ {conv.their_agent.name}
                                </h3>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-stone-400">
                                <span className={`flex items-center gap-1 ${status.color}`}>
                                  {status.icon}
                                  {status.label}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {conv.turn_count} turns
                                </span>
                                {conv.compatibility_score !== null && (
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    {Math.round(conv.compatibility_score * 100)}%
                                  </span>
                                )}
                              </div>
                              {conv.space && (
                                <p className="text-xs text-stone-500 mt-1">
                                  {conv.space.icon} {conv.space.name}
                                </p>
                              )}
                            </div>

                            {/* Time & Arrow */}
                            <div className="text-right">
                              <p className="text-xs text-stone-500">
                                {conv.last_message_at
                                  ? new Date(conv.last_message_at).toLocaleDateString()
                                  : new Date(conv.started_at).toLocaleDateString()}
                              </p>
                              <ChevronRight className="w-5 h-5 text-stone-500 ml-auto mt-1" />
                            </div>
                          </div>
                        </Card>
                      </Link>
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
