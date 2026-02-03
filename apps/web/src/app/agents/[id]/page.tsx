'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  Heart,
  Settings,
  Trash2,
  Plus,
  RefreshCw,
  Globe,
  Target,
  Loader2,
  Power,
  PowerOff,
} from 'lucide-react'
import { BottomNav } from '@/components/layout'
import { Button, Card, Badge, Avatar, Input, Textarea, Modal } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface Intent {
  id: string
  type: string
  title: string
  description: string | null
  preferences: Record<string, unknown>
  priority: number
  is_active: boolean
}

interface Agent {
  id: string
  name: string
  handle: string
  avatar_url: string | null
  bio: string | null
  connection_type: string
  connection_config: Record<string, unknown>
  is_active: boolean
  is_verified: boolean
  health_status: 'healthy' | 'unhealthy' | 'unknown'
  last_health_check_at: string | null
  total_conversations: number
  total_matches: number
  created_at: string
  intents?: Intent[]
}

const intentTypes = [
  { value: 'investment', label: 'Investment', description: 'Looking for investors or startups to invest in' },
  { value: 'cofounder', label: 'Co-founder', description: 'Seeking a co-founder for a venture' },
  { value: 'dating', label: 'Dating', description: 'Looking for romantic connections' },
  { value: 'collaboration', label: 'Collaboration', description: 'Seeking project collaborators' },
  { value: 'friendship', label: 'Friendship', description: 'Looking for friends with shared interests' },
  { value: 'hiring', label: 'Hiring', description: 'Looking to hire or get hired' },
  { value: 'mentorship', label: 'Mentorship', description: 'Seeking mentors or mentees' },
  { value: 'custom', label: 'Custom', description: 'Other type of connection' },
]

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingActive, setIsTogglingActive] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showIntentModal, setShowIntentModal] = useState(false)
  const [editingIntent, setEditingIntent] = useState<Intent | null>(null)

  // Intent form state
  const [intentType, setIntentType] = useState('investment')
  const [intentTitle, setIntentTitle] = useState('')
  const [intentDescription, setIntentDescription] = useState('')
  const [isSavingIntent, setIsSavingIntent] = useState(false)

  const fetchAgent = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/agents/${id}`)
      const data = await response.json()

      if (data.success) {
        setAgent(data.agent)
      } else {
        toast.error('Agent not found')
        router.push('/agents')
      }
    } catch (error) {
      console.error('Error fetching agent:', error)
      toast.error('Failed to load agent')
    } finally {
      setIsLoading(false)
    }
  }, [user, id, router])

  useEffect(() => {
    fetchAgent()
  }, [fetchAgent])

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      const response = await fetch(`/api/agents/${id}/test`, { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        toast.success(`Connection healthy! (${data.response_time_ms}ms)`)
      } else {
        toast.error(data.message || 'Connection test failed')
      }

      fetchAgent()
    } catch (error) {
      toast.error('Failed to test connection')
    } finally {
      setIsTesting(false)
    }
  }

  const handleToggleActive = async () => {
    if (!agent) return

    setIsTogglingActive(true)
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !agent.is_active }),
      })
      const data = await response.json()

      if (data.success) {
        toast.success(agent.is_active ? 'Agent deactivated' : 'Agent activated')
        fetchAgent()
      } else {
        toast.error('Failed to update agent')
      }
    } catch (error) {
      toast.error('Failed to update agent')
    } finally {
      setIsTogglingActive(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/agents/${id}`, { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        toast.success('Agent deleted')
        router.push('/agents')
      } else {
        toast.error('Failed to delete agent')
      }
    } catch (error) {
      toast.error('Failed to delete agent')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleSaveIntent = async () => {
    if (!intentTitle.trim()) {
      toast.error('Intent title is required')
      return
    }

    setIsSavingIntent(true)
    try {
      if (editingIntent) {
        // Update existing intent
        const response = await fetch(`/api/agents/${id}/intents`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intent_id: editingIntent.id,
            type: intentType,
            title: intentTitle.trim(),
            description: intentDescription.trim() || null,
          }),
        })
        const data = await response.json()

        if (data.success) {
          toast.success('Intent updated')
        } else {
          toast.error(data.error || 'Failed to update intent')
          return
        }
      } else {
        // Create new intent
        const response = await fetch(`/api/agents/${id}/intents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: intentType,
            title: intentTitle.trim(),
            description: intentDescription.trim() || null,
          }),
        })
        const data = await response.json()

        if (data.success) {
          toast.success('Intent added')
        } else {
          toast.error(data.error || 'Failed to add intent')
          return
        }
      }

      setShowIntentModal(false)
      setEditingIntent(null)
      setIntentType('investment')
      setIntentTitle('')
      setIntentDescription('')
      fetchAgent()
    } catch (error) {
      toast.error('Failed to save intent')
    } finally {
      setIsSavingIntent(false)
    }
  }

  const handleDeleteIntent = async (intentId: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/intents?intent_id=${intentId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Intent deleted')
        fetchAgent()
      } else {
        toast.error('Failed to delete intent')
      }
    } catch (error) {
      toast.error('Failed to delete intent')
    }
  }

  const openEditIntent = (intent: Intent) => {
    setEditingIntent(intent)
    setIntentType(intent.type)
    setIntentTitle(intent.title)
    setIntentDescription(intent.description || '')
    setShowIntentModal(true)
  }

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Healthy
          </Badge>
        )
      case 'unhealthy':
        return (
          <Badge variant="error">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unhealthy
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!agent) {
    return null
  }

  return (
    <div className="min-h-screen bg-stone-900">
      <div className="min-h-screen pt-16 pb-24 bg-stone-900">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/agents">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold text-stone-50">
                {agent.name}
              </h1>
              <p className="text-stone-400">@{agent.handle}</p>
            </div>
          </div>

          {/* Agent Overview */}
          <Card className="p-6 mb-6">
            <div className="flex items-start gap-4">
              <Avatar
                src={agent.avatar_url}
                name={agent.name}
                size="xl"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {getHealthBadge(agent.health_status)}
                  {agent.is_verified && <Badge variant="success">Verified</Badge>}
                  {!agent.is_active && <Badge variant="secondary">Inactive</Badge>}
                </div>

                {agent.bio && (
                  <p className="text-stone-300 mb-4">{agent.bio}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-stone-50">{agent.total_conversations}</div>
                    <div className="text-stone-400">Conversations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-stone-50">{agent.total_matches}</div>
                    <div className="text-stone-400">Matches</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-stone-700">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleActive}
                disabled={isTogglingActive}
              >
                {agent.is_active ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="text-red-400 hover:text-red-300 hover:border-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </Card>

          {/* Intents */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-stone-50 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-400" />
                  Intents
                </h2>
                <p className="text-sm text-stone-400">What your agent is looking for</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingIntent(null)
                  setIntentType('investment')
                  setIntentTitle('')
                  setIntentDescription('')
                  setShowIntentModal(true)
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {agent.intents && agent.intents.length > 0 ? (
              <div className="space-y-3">
                {agent.intents.map((intent) => (
                  <motion.div
                    key={intent.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-stone-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" size="sm">{intent.type}</Badge>
                          {!intent.is_active && (
                            <Badge variant="secondary" size="sm">Inactive</Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-stone-50">{intent.title}</h3>
                        {intent.description && (
                          <p className="text-sm text-stone-400 mt-1">{intent.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditIntent(intent)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteIntent(intent.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No intents configured</p>
                <p className="text-sm">Add intents to help your agent find matches</p>
              </div>
            )}
          </Card>

          {/* Connection Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-stone-50 flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary-400" />
              Connection Details
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-400">Type</span>
                <span className="text-stone-50">{agent.connection_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Last Health Check</span>
                <span className="text-stone-50">
                  {agent.last_health_check_at
                    ? new Date(agent.last_health_check_at).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Created</span>
                <span className="text-stone-50">
                  {new Date(agent.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Agent"
      >
        <p className="text-stone-300 mb-6">
          Are you sure you want to delete <strong>{agent.name}</strong>? This will also remove all conversations and matches associated with this agent.
        </p>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete Agent'}
          </Button>
        </div>
      </Modal>

      {/* Intent Modal */}
      <Modal
        isOpen={showIntentModal}
        onClose={() => setShowIntentModal(false)}
        title={editingIntent ? 'Edit Intent' : 'Add Intent'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Intent Type
            </label>
            <select
              value={intentType}
              onChange={(e) => setIntentType(e.target.value)}
              className="w-full px-4 py-3 bg-stone-800 rounded-xl border border-stone-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-stone-50"
            >
              {intentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Title *
            </label>
            <Input
              value={intentTitle}
              onChange={(e) => setIntentTitle(e.target.value)}
              placeholder="e.g., Seeking pre-seed investment for AI startup"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Description (optional)
            </label>
            <Textarea
              value={intentDescription}
              onChange={(e) => setIntentDescription(e.target.value)}
              placeholder="More details about what you're looking for..."
              rows={3}
            />
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowIntentModal(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveIntent}
            disabled={isSavingIntent || !intentTitle.trim()}
            className="flex-1"
          >
            {isSavingIntent ? 'Saving...' : editingIntent ? 'Update' : 'Add Intent'}
          </Button>
        </div>
      </Modal>

      <BottomNav />
    </div>
  )
}
