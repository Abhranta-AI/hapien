'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Heart,
  Check,
  X,
  Calendar,
  MessageSquare,
  Video,
  Mail,
  MapPin,
  Send,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { BottomNav } from '@/components/layout'
import { Button, Card, Badge, Avatar, Modal, Input, Textarea } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface Message {
  id: string
  content: string
  sender_agent_id: string
  turn_number: number
  created_at: string
  metadata: Record<string, unknown>
}

interface Match {
  id: string
  compatibility_score: number
  match_reason: string | null
  conversation_highlights: Array<{ message_id: string; summary: string }>
  status: string
  created_at: string
  intro_scheduled_at: string | null
  intro_method: string | null
  intro_notes: string | null
  your_agent: {
    id: string
    name: string
    handle: string
    avatar_url: string | null
    bio: string | null
    intents?: Array<{ id: string; type: string; title: string }>
  }
  their_agent: {
    id: string
    name: string
    handle: string
    avatar_url: string | null
    bio: string | null
    owner: {
      id: string
      name: string
      avatar_url: string | null
      bio: string | null
    }
    intents?: Array<{ id: string; type: string; title: string }>
  }
  space: {
    id: string
    name: string
    slug: string
    icon: string | null
    type: string
  } | null
  conversation?: {
    id: string
    turn_count: number
    started_at: string
    messages: Message[]
  }
  your_approval: boolean | null
  their_approval: boolean | null
  can_approve: boolean
  can_schedule_intro: boolean
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending Approval', color: 'text-amber-400', bgColor: 'bg-amber-900/30' },
  both_approved: { label: 'Ready to Connect', color: 'text-emerald-400', bgColor: 'bg-emerald-900/30' },
  intro_scheduled: { label: 'Intro Scheduled', color: 'text-blue-400', bgColor: 'bg-blue-900/30' },
  connected: { label: 'Connected', color: 'text-emerald-400', bgColor: 'bg-emerald-900/30' },
  declined: { label: 'Declined', color: 'text-stone-400', bgColor: 'bg-stone-800' },
  expired: { label: 'Expired', color: 'text-stone-400', bgColor: 'bg-stone-800' },
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [match, setMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showConversation, setShowConversation] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)

  // Schedule form
  const [introMethod, setIntroMethod] = useState<string>('video_call')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [introNotes, setIntroNotes] = useState('')

  const fetchMatch = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/matches/${id}`)
      const data = await response.json()

      if (data.success) {
        setMatch(data.match)
      } else {
        toast.error('Match not found')
        router.push('/matches')
      }
    } catch (error) {
      console.error('Error fetching match:', error)
      toast.error('Failed to load match')
    } finally {
      setIsLoading(false)
    }
  }, [user, id, router])

  useEffect(() => {
    fetchMatch()
  }, [fetchMatch])

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const response = await fetch(`/api/matches/${id}/approve`, { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Match approved!')
        fetchMatch()
      } else {
        toast.error(data.error || 'Failed to approve match')
      }
    } catch (error) {
      toast.error('Failed to approve match')
    } finally {
      setIsApproving(false)
    }
  }

  const handleDecline = async () => {
    setIsDeclining(true)
    try {
      const response = await fetch(`/api/matches/${id}/decline`, { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        toast.success('Match declined')
        router.push('/matches')
      } else {
        toast.error(data.error || 'Failed to decline match')
      }
    } catch (error) {
      toast.error('Failed to decline match')
    } finally {
      setIsDeclining(false)
    }
  }

  const handleScheduleIntro = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select a date and time')
      return
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()

    setIsScheduling(true)
    try {
      const response = await fetch(`/api/matches/${id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intro_method: introMethod,
          scheduled_at: scheduledAt,
          notes: introNotes || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Intro scheduled!')
        setShowScheduleModal(false)
        fetchMatch()
      } else {
        toast.error(data.error || 'Failed to schedule intro')
      }
    } catch (error) {
      toast.error('Failed to schedule intro')
    } finally {
      setIsScheduling(false)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!match) {
    return null
  }

  const status = statusConfig[match.status] || statusConfig.pending

  return (
    <div className="min-h-screen bg-stone-900">
      <div className="min-h-screen pt-16 pb-24 bg-stone-900">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/matches">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-display font-bold text-stone-50">
                Match Details
              </h1>
            </div>
          </div>

          {/* Status Banner */}
          <Card className={`p-4 mb-6 ${status.bgColor} border-0`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className={`w-5 h-5 ${status.color}`} />
                <span className={`font-medium ${status.color}`}>{status.label}</span>
              </div>
              <span className="text-2xl font-bold text-stone-50">
                {Math.round(match.compatibility_score * 100)}% Match
              </span>
            </div>
            {match.match_reason && (
              <p className="text-sm text-stone-300 mt-2">{match.match_reason}</p>
            )}
          </Card>

          {/* Their Agent/Person */}
          <Card className="p-6 mb-6">
            <h2 className="text-sm font-medium text-stone-400 mb-4">THEIR PROFILE</h2>
            <div className="flex items-start gap-4">
              <Avatar
                src={match.their_agent.avatar_url}
                name={match.their_agent.name}
                size="xl"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-stone-50">
                  {match.their_agent.name}
                </h3>
                <p className="text-sm text-stone-400">@{match.their_agent.handle}</p>

                {match.their_agent.bio && (
                  <p className="text-stone-300 mt-2">{match.their_agent.bio}</p>
                )}

                {match.their_agent.intents && match.their_agent.intents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {match.their_agent.intents.map(intent => (
                      <Badge key={intent.id} variant="outline" size="sm">
                        {intent.title}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Human owner */}
                {match.their_agent.owner && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-700">
                    <Avatar
                      src={match.their_agent.owner.avatar_url}
                      name={match.their_agent.owner.name}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm text-stone-50">{match.their_agent.owner.name}</p>
                      <p className="text-xs text-stone-500">Human behind the agent</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Your Agent */}
          <Card className="p-6 mb-6">
            <h2 className="text-sm font-medium text-stone-400 mb-4">YOUR AGENT</h2>
            <div className="flex items-center gap-4">
              <Avatar
                src={match.your_agent.avatar_url}
                name={match.your_agent.name}
                size="lg"
              />
              <div>
                <h3 className="font-semibold text-stone-50">{match.your_agent.name}</h3>
                <p className="text-sm text-stone-400">@{match.your_agent.handle}</p>
              </div>
            </div>
          </Card>

          {/* Space */}
          {match.space && (
            <Card className="p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{match.space.icon || '🌐'}</span>
                <div>
                  <p className="text-sm text-stone-400">Matched in</p>
                  <Link href={`/spaces/${match.space.slug}`} className="font-medium text-stone-50 hover:text-primary-400">
                    {match.space.name}
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Conversation */}
          {match.conversation && match.conversation.messages && match.conversation.messages.length > 0 && (
            <Card className="mb-6 overflow-hidden">
              <button
                onClick={() => setShowConversation(!showConversation)}
                className="w-full p-4 flex items-center justify-between hover:bg-stone-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-primary-400" />
                  <span className="font-medium text-stone-50">Conversation</span>
                  <Badge variant="secondary" size="sm">
                    {match.conversation.messages.length} messages
                  </Badge>
                </div>
                {showConversation ? (
                  <ChevronUp className="w-5 h-5 text-stone-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-stone-400" />
                )}
              </button>

              {showConversation && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="border-t border-stone-700"
                >
                  <div className="p-4 max-h-96 overflow-y-auto space-y-4">
                    {match.conversation.messages.map((msg) => {
                      const isYourAgent = msg.sender_agent_id === match.your_agent.id
                      const sender = isYourAgent ? match.your_agent : match.their_agent

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${isYourAgent ? 'flex-row-reverse' : ''}`}
                        >
                          <Avatar
                            src={sender.avatar_url}
                            name={sender.name}
                            size="sm"
                          />
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              isYourAgent
                                ? 'bg-primary-600 text-white'
                                : 'bg-stone-800 text-stone-200'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isYourAgent ? 'text-primary-200' : 'text-stone-500'}`}>
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </Card>
          )}

          {/* Intro Details (if scheduled) */}
          {match.status === 'intro_scheduled' && match.intro_scheduled_at && (
            <Card className="p-6 mb-6 bg-blue-900/20 border-blue-700/50">
              <h2 className="text-sm font-medium text-blue-400 mb-4">SCHEDULED INTRO</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className="text-stone-50">
                    {new Date(match.intro_scheduled_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {match.intro_method && (
                  <div className="flex items-center gap-3">
                    {match.intro_method === 'video_call' && <Video className="w-5 h-5 text-blue-400" />}
                    {match.intro_method === 'in_person' && <MapPin className="w-5 h-5 text-blue-400" />}
                    {match.intro_method === 'message' && <MessageSquare className="w-5 h-5 text-blue-400" />}
                    {match.intro_method === 'email' && <Mail className="w-5 h-5 text-blue-400" />}
                    <span className="text-stone-50 capitalize">{match.intro_method.replace('_', ' ')}</span>
                  </div>
                )}
                {match.intro_notes && (
                  <p className="text-sm text-stone-300 mt-2">{match.intro_notes}</p>
                )}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {match.can_approve && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={isDeclining}
                  className="flex-1"
                >
                  {isDeclining ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Decline
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isApproving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Approve Match
                </Button>
              </div>
            )}

            {match.can_schedule_intro && (
              <Button
                onClick={() => setShowScheduleModal(true)}
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Intro
              </Button>
            )}

            {match.status === 'pending' && !match.can_approve && (
              <Card className="p-4 bg-amber-900/20 border-amber-700/50">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-amber-300 font-medium">Waiting for their approval</p>
                    <p className="text-sm text-stone-400">You've approved this match. Waiting for {match.their_agent.name}'s owner.</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Intro Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Intro"
      >
        <div className="space-y-4">
          {/* Intro Method */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              How would you like to connect?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'video_call', label: 'Video Call', icon: <Video className="w-4 h-4" /> },
                { value: 'in_person', label: 'In Person', icon: <MapPin className="w-4 h-4" /> },
                { value: 'message', label: 'Message', icon: <MessageSquare className="w-4 h-4" /> },
                { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
              ].map((method) => (
                <button
                  key={method.value}
                  onClick={() => setIntroMethod(method.value)}
                  className={`p-3 rounded-lg border transition-colors flex items-center gap-2 ${
                    introMethod === method.value
                      ? 'border-primary-500 bg-primary-900/30 text-primary-400'
                      : 'border-stone-700 text-stone-400 hover:border-stone-600'
                  }`}
                >
                  {method.icon}
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Date
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Time
              </label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Notes (optional)
            </label>
            <Textarea
              value={introNotes}
              onChange={(e) => setIntroNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowScheduleModal(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleScheduleIntro}
            disabled={isScheduling || !scheduledDate || !scheduledTime}
            className="flex-1"
          >
            {isScheduling ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Schedule
          </Button>
        </div>
      </Modal>

      <BottomNav />
    </div>
  )
}
