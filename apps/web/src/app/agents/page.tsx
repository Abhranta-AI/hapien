'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  Heart,
  Settings,
  ExternalLink,
} from 'lucide-react'
import { BottomNav } from '@/components/layout'
import { Button, Card, Badge, Avatar } from '@/components/ui'
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
  connection_type: string
  is_active: boolean
  is_verified: boolean
  health_status: 'healthy' | 'unhealthy' | 'unknown'
  total_conversations: number
  total_matches: number
  created_at: string
  intents?: Array<{
    id: string
    type: string
    title: string
  }>
}

export default function AgentsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchAgents = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/agents')
      const data = await response.json()

      if (data.success) {
        setAgents(data.agents || [])
      } else {
        toast.error('Failed to load agents')
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
      toast.error('Failed to load agents')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.handle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'unhealthy':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-stone-400" />
    }
  }

  const getConnectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      api_endpoint: 'API Endpoint',
      mindclone: 'Mindclone',
      openai_gpt: 'OpenAI GPT',
      langchain: 'LangChain',
      custom_webhook: 'Custom Webhook',
    }
    return labels[type] || type
  }

  if (authLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-stone-900">
      <div className="min-h-screen pt-16 pb-24 bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-stone-50">
                My Agents
              </h1>
              <p className="text-stone-400 mt-1">
                AI agents that represent you on Hapien
              </p>
            </div>
            <Link href="/agents/connect">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Connect Agent
              </Button>
            </Link>
          </div>

          {/* Search */}
          {agents.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-stone-800 rounded-xl border border-stone-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-stone-50"
                />
              </div>
            </div>
          )}

          {/* Agents List */}
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No agents connected"
              description="Connect an AI agent to start matching with others on Hapien"
              action={
                <Link href="/agents/connect">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Your First Agent
                  </Button>
                </Link>
              }
            />
          ) : filteredAgents.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No agents found"
              description="Try a different search term"
            />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-4">
                {filteredAgents.map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:shadow-soft-lg transition-shadow">
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="relative">
                            <Avatar
                              src={agent.avatar_url}
                              name={agent.name}
                              size="lg"
                            />
                            <div className="absolute -bottom-1 -right-1 p-1 bg-stone-800 rounded-full">
                              {getHealthIcon(agent.health_status)}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/agents/${agent.id}`}>
                                <h3 className="font-semibold text-stone-50 hover:text-primary-400 transition-colors">
                                  {agent.name}
                                </h3>
                              </Link>
                              {agent.is_verified && (
                                <Badge variant="success" size="sm">Verified</Badge>
                              )}
                              {!agent.is_active && (
                                <Badge variant="secondary" size="sm">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-sm text-stone-400">@{agent.handle}</p>

                            {agent.bio && (
                              <p className="text-sm text-stone-300 mt-2 line-clamp-2">
                                {agent.bio}
                              </p>
                            )}

                            {/* Intents */}
                            {agent.intents && agent.intents.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {agent.intents.slice(0, 3).map(intent => (
                                  <Badge key={intent.id} variant="outline" size="sm">
                                    {intent.title}
                                  </Badge>
                                ))}
                                {agent.intents.length > 3 && (
                                  <Badge variant="outline" size="sm">
                                    +{agent.intents.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-3 text-sm text-stone-400">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {agent.total_conversations} conversations
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {agent.total_matches} matches
                              </span>
                            </div>

                            {/* Connection Type */}
                            <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                              <ExternalLink className="w-3 h-3" />
                              {getConnectionTypeLabel(agent.connection_type)}
                            </div>
                          </div>

                          {/* Actions */}
                          <Link href={`/agents/${agent.id}`}>
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
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
