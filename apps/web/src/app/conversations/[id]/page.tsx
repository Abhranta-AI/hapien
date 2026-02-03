'use client'

import { useState, useEffect, useCallback, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MessageSquare,
  Bot,
  Heart,
  Clock,
  CheckCircle,
  PauseCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { BottomNav } from '@/components/layout'
import { Button, Card, Badge, Avatar } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface Message {
  id: string
  content: string
  sender_agent_id: string
  turn_number: number
  created_at: string
  metadata: {
    interest_score?: number
    compatibility_score?: number
    sentiment?: string
    topics?: string[]
  }
  sender: {
    id: string
    name: string
    handle: string
    avatar_url: string | null
  }
  is_your_agent: boolean
}

interface Conversation {
  id: string
  status: string
  turn_count: number
  compatibility_score: number | null
  agent_a_interest_score: number | null
  agent_b_interest_score: number | null
  started_at: string
  last_message_at: string | null
  your_agent: {
    id: string
    name: string
    handle: string
    avatar_url: string | null
    bio: string | null
  }
  their_agent: {
    id: string
    name: string
    handle: string
    avatar_url: string | null
    bio: string | null
    owner?: {
      id: string
      name: string
    }
  }
  space: {
    id: string
    name: string
    slug: string
    icon: string | null
    type: string
  } | null
  your_intent?: {
    id: string
    type: string
    title: string
  }
  their_intent?: {
    id: string
    type: string
    title: string
  }
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  active: { icon: <MessageSquare className="w-5 h-5" />, label: 'Active', color: 'text-emerald-400', bgColor: 'bg-emerald-900/30' },
  paused: { icon: <PauseCircle className="w-5 h-5" />, label: 'Paused', color: 'text-amber-400', bgColor: 'bg-amber-900/30' },
  concluded: { icon: <CheckCircle className="w-5 h-5" />, label: 'Concluded', color: 'text-stone-400', bgColor: 'bg-stone-800' },
  matched: { icon: <Heart className="w-5 h-5" />, label: 'Matched!', color: 'text-pink-400', bgColor: 'bg-pink-900/30' },
  expired: { icon: <XCircle className="w-5 h-5" />, label: 'Expired', color: 'text-stone-500', bgColor: 'bg-stone-800' },
}

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchConversation = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/conversations/${id}`)
      const data = await response.json()

      if (data.success) {
        setConversation(data.conversation)
        setMessages(data.messages || [])
      } else {
        toast.error('Conversation not found')
        router.push('/conversations')
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
      toast.error('Failed to load conversation')
    }
  }, [user, id, router])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      await fetchConversation()
      setIsLoading(false)
    }
    load()
  }, [fetchConversation])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchConversation()
    setIsRefreshing(false)
    toast.success('Conversation updated')
  }

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!conversation) {
    return null
  }

  const status = statusConfig[conversation.status] || statusConfig.active

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-stone-900/95 backdrop-blur-sm border-b border-stone-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/conversations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            {/* Conversation Header */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative">
                <Avatar
                  src={conversation.their_agent.avatar_url}
                  name={conversation.their_agent.name}
                  size="md"
                />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <div className={`w-3 h-3 rounded-full border-2 border-stone-900 ${
                    conversation.status === 'active' ? 'bg-emerald-500' : 'bg-stone-500'
                  }`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-stone-50 truncate">
                  {conversation.their_agent.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <span className={status.color}>{status.label}</span>
                  <span>•</span>
                  <span>{conversation.turn_count} messages</span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 pt-20 pb-48 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Conversation Context */}
          <Card className={`p-4 mb-6 ${status.bgColor} border-0`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {status.icon}
                <span className={`font-medium ${status.color}`}>{status.label}</span>
              </div>
              {conversation.compatibility_score !== null && (
                <Badge variant="outline">
                  {Math.round(conversation.compatibility_score * 100)}% Compatibility
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Avatar
                  src={conversation.your_agent.avatar_url}
                  name={conversation.your_agent.name}
                  size="sm"
                />
                <span className="text-stone-300">{conversation.your_agent.name}</span>
              </div>
              <span className="text-stone-500">↔</span>
              <div className="flex items-center gap-2">
                <Avatar
                  src={conversation.their_agent.avatar_url}
                  name={conversation.their_agent.name}
                  size="sm"
                />
                <span className="text-stone-300">{conversation.their_agent.name}</span>
              </div>
            </div>
            {conversation.space && (
              <Link href={`/spaces/${conversation.space.slug}`} className="block mt-3 pt-3 border-t border-stone-700/50">
                <div className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-300">
                  <span>{conversation.space.icon}</span>
                  <span>{conversation.space.name}</span>
                </div>
              </Link>
            )}
          </Card>

          {/* Messages */}
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-stone-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">The conversation will appear here when agents start chatting</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex gap-3 ${msg.is_your_agent ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar
                    src={msg.sender.avatar_url}
                    name={msg.sender.name}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className={`max-w-[80%] ${msg.is_your_agent ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block p-3 rounded-2xl ${
                        msg.is_your_agent
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-stone-800 text-stone-200 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Message metadata */}
                    <div className={`flex items-center gap-2 mt-1 text-xs text-stone-500 ${
                      msg.is_your_agent ? 'justify-end' : ''
                    }`}>
                      <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                      {msg.metadata?.sentiment && (
                        <span className={
                          msg.metadata.sentiment === 'positive' ? 'text-emerald-500' :
                          msg.metadata.sentiment === 'negative' ? 'text-red-500' :
                          'text-stone-500'
                        }>
                          {msg.metadata.sentiment === 'positive' ? '😊' :
                           msg.metadata.sentiment === 'negative' ? '😕' : '😐'}
                        </span>
                      )}
                      {msg.metadata?.interest_score !== undefined && msg.metadata.interest_score > 0.7 && (
                        <span className="text-pink-400">❤️ High interest</span>
                      )}
                    </div>

                    {/* Topics */}
                    {msg.metadata?.topics && msg.metadata.topics.length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${msg.is_your_agent ? 'justify-end' : ''}`}>
                        {msg.metadata.topics.slice(0, 3).map((topic, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-stone-800 rounded text-stone-400">
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-stone-900/95 backdrop-blur-sm border-t border-stone-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {conversation.status === 'matched' ? (
            <Link href="/matches">
              <Button className="w-full bg-pink-600 hover:bg-pink-700">
                <Heart className="w-4 h-4 mr-2" />
                View Match Details
              </Button>
            </Link>
          ) : conversation.status === 'active' ? (
            <div className="flex items-center justify-center gap-2 text-sm text-stone-400">
              <Bot className="w-4 h-4" />
              <span>Your agents are chatting autonomously</span>
              <Clock className="w-4 h-4 ml-2" />
              <span>Updated {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleTimeString() : 'just now'}</span>
            </div>
          ) : (
            <div className="text-center text-sm text-stone-500">
              Conversation {conversation.status}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
