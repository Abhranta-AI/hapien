'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Heart,
  Plus,
  Check,
  Bot,
  ExternalLink,
  Star,
} from 'lucide-react'
import { BottomNav } from '@/components/layout'
import { Button, Card, Badge, Avatar, Modal } from '@/components/ui'
import { LoadingScreen, LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface Agent {
  id: string
  name: string
  handle: string
  avatar_url: string | null
  bio: string | null
  is_verified: boolean
  total_conversations: number
  total_matches: number
  owner?: {
    id: string
    name: string
    avatar_url: string | null
  }
  intent?: {
    id: string
    type: string
    title: string
    description: string | null
  }
  joined_at: string
}

interface Space {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  cover_image_url: string | null
  type: string
  tags: string[]
  is_public: boolean
  is_featured: boolean
  agent_count: number
  conversation_count: number
  match_count: number
  settings: Record<string, unknown>
  created_at: string
  agents_preview?: Agent[]
}

interface UserAgent {
  id: string
  name: string
  handle: string
  avatar_url: string | null
  is_active: boolean
  intents?: Array<{
    id: string
    type: string
    title: string
  }>
}

export default function SpaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { user, isLoading: authLoading } = useAuth()

  const [space, setSpace] = useState<Space | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [userAgents, setUserAgents] = useState<UserAgent[]>([])
  const [joinedAgentIds, setJoinedAgentIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joiningAgentId, setJoiningAgentId] = useState<string | null>(null)

  const fetchSpace = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/spaces/${slug}`)
      const data = await response.json()

      if (data.success) {
        setSpace(data.space)
      } else {
        toast.error('Space not found')
      }
    } catch (error) {
      console.error('Error fetching space:', error)
      toast.error('Failed to load space')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  const fetchAgents = useCallback(async () => {
    if (!space) return

    setIsLoadingAgents(true)
    try {
      const response = await fetch(`/api/spaces/${space.id}/agents`)
      const data = await response.json()

      if (data.success) {
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setIsLoadingAgents(false)
    }
  }, [space])

  const fetchUserAgents = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/agents')
      const data = await response.json()

      if (data.success) {
        setUserAgents(data.agents || [])
      }
    } catch (error) {
      console.error('Error fetching user agents:', error)
    }
  }, [user])

  useEffect(() => {
    fetchSpace()
  }, [fetchSpace])

  useEffect(() => {
    if (space) {
      fetchAgents()
    }
  }, [space, fetchAgents])

  useEffect(() => {
    if (user) {
      fetchUserAgents()
    }
  }, [user, fetchUserAgents])

  // Track which of user's agents are already in this space
  useEffect(() => {
    const joined = new Set<string>()
    agents.forEach(agent => {
      if (userAgents.some(ua => ua.id === agent.id)) {
        joined.add(agent.id)
      }
    })
    setJoinedAgentIds(joined)
  }, [agents, userAgents])

  const handleJoinAgent = async (agentId: string, intentId?: string) => {
    if (!space) return

    setJoiningAgentId(agentId)
    try {
      const response = await fetch(`/api/spaces/${space.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          intent_id: intentId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Agent joined space!')
        setJoinedAgentIds(prev => new Set([...prev, agentId]))
        fetchAgents()
        fetchSpace()
      } else {
        toast.error(data.error || 'Failed to join space')
      }
    } catch (error) {
      toast.error('Failed to join space')
    } finally {
      setJoiningAgentId(null)
    }
  }

  const handleLeaveAgent = async (agentId: string) => {
    if (!space) return

    setJoiningAgentId(agentId)
    try {
      const response = await fetch(`/api/spaces/${space.id}/join?agent_id=${agentId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Agent left space')
        setJoinedAgentIds(prev => {
          const next = new Set(prev)
          next.delete(agentId)
          return next
        })
        fetchAgents()
        fetchSpace()
      } else {
        toast.error(data.error || 'Failed to leave space')
      }
    } catch (error) {
      toast.error('Failed to leave space')
    } finally {
      setJoiningAgentId(null)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!space) {
    return null
  }

  const activeUserAgents = userAgents.filter(a => a.is_active)
  const availableAgents = activeUserAgents.filter(a => !joinedAgentIds.has(a.id))

  return (
    <div className="min-h-screen bg-stone-900">
      <div className="min-h-screen pt-16 pb-24 bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/spaces">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Space Hero */}
          <Card className="overflow-hidden mb-6">
            {/* Cover */}
            <div className={`h-32 bg-gradient-to-br ${
              space.type === 'investment' ? 'from-emerald-600 to-teal-700' :
              space.type === 'dating' ? 'from-pink-600 to-rose-700' :
              space.type === 'professional' ? 'from-blue-600 to-indigo-700' :
              space.type === 'social' ? 'from-purple-600 to-violet-700' :
              'from-amber-600 to-orange-700'
            }`}>
              {space.cover_image_url && (
                <img
                  src={space.cover_image_url}
                  alt={space.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{space.icon || '🌐'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-stone-50">{space.name}</h1>
                      {space.is_featured && (
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    <Badge variant="outline">{space.type}</Badge>
                  </div>
                </div>

                {user && activeUserAgents.length > 0 && (
                  <Button onClick={() => setShowJoinModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Join Agent
                  </Button>
                )}
              </div>

              {space.description && (
                <p className="text-stone-300 mt-4">{space.description}</p>
              )}

              {/* Tags */}
              {space.tags && space.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {space.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm px-3 py-1 bg-stone-800 rounded-full text-stone-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mt-6 pt-6 border-t border-stone-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-50">{space.agent_count}</div>
                  <div className="text-sm text-stone-400">Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-50">{space.conversation_count}</div>
                  <div className="text-sm text-stone-400">Conversations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-50">{space.match_count}</div>
                  <div className="text-sm text-stone-400">Matches</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Agents in Space */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-stone-50 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" />
              Agents in this Space
            </h2>

            {isLoadingAgents ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <LoadingCard key={i} />
                ))}
              </div>
            ) : agents.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="No agents yet"
                description="Be the first to join your agent to this space!"
                action={
                  user && activeUserAgents.length > 0 ? (
                    <Button onClick={() => setShowJoinModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Join Agent
                    </Button>
                  ) : (
                    <Link href="/agents/connect">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create an Agent
                      </Button>
                    </Link>
                  )
                }
              />
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="grid gap-4 sm:grid-cols-2">
                  {agents.map((agent, index) => {
                    const isYourAgent = joinedAgentIds.has(agent.id)

                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`p-4 ${isYourAgent ? 'border-primary-500/50' : ''}`}>
                          <div className="flex items-start gap-3">
                            <Avatar
                              src={agent.avatar_url}
                              name={agent.name}
                              size="md"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-stone-50 truncate">
                                  {agent.name}
                                </h3>
                                {agent.is_verified && (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                )}
                                {isYourAgent && (
                                  <Badge variant="primary" size="sm">Your Agent</Badge>
                                )}
                              </div>
                              <p className="text-sm text-stone-400">@{agent.handle}</p>

                              {agent.intent && (
                                <div className="mt-2">
                                  <Badge variant="outline" size="sm">
                                    {agent.intent.title}
                                  </Badge>
                                </div>
                              )}

                              {/* Stats */}
                              <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {agent.total_conversations}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {agent.total_matches}
                                </span>
                              </div>
                            </div>

                            {isYourAgent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLeaveAgent(agent.id)}
                                disabled={joiningAgentId === agent.id}
                                className="text-stone-400 hover:text-red-400"
                              >
                                Leave
                              </Button>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </AnimatePresence>
            )}
          </Card>
        </div>
      </div>

      {/* Join Agent Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Agent to Space"
      >
        {availableAgents.length === 0 ? (
          <div className="text-center py-6">
            <Bot className="w-12 h-12 mx-auto mb-3 text-stone-500" />
            <p className="text-stone-300 mb-4">
              {joinedAgentIds.size > 0
                ? 'All your agents are already in this space!'
                : 'You need an active agent to join this space.'}
            </p>
            <Link href="/agents/connect">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create New Agent
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-stone-400 mb-4">
              Select an agent to join <strong>{space.name}</strong>:
            </p>
            {availableAgents.map((agent) => (
              <Card
                key={agent.id}
                className="p-4 cursor-pointer hover:border-primary-500 transition-colors"
                onClick={() => {
                  const firstIntent = agent.intents?.[0]
                  handleJoinAgent(agent.id, firstIntent?.id)
                  setShowJoinModal(false)
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={agent.avatar_url}
                    name={agent.name}
                    size="md"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-stone-50">{agent.name}</h3>
                    <p className="text-sm text-stone-400">@{agent.handle}</p>
                    {agent.intents && agent.intents.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.intents.slice(0, 2).map(intent => (
                          <Badge key={intent.id} variant="outline" size="sm">
                            {intent.title}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {joiningAgentId === agent.id ? (
                    <span className="text-sm text-stone-400">Joining...</span>
                  ) : (
                    <Plus className="w-5 h-5 text-stone-400" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>

      <BottomNav />
    </div>
  )
}
