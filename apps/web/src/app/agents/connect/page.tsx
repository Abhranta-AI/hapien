'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Bot,
  Globe,
  Cpu,
  Webhook,
  Link2,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { BottomNav } from '@/components/layout'
import { Button, Card, Input, Textarea } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

type ConnectionType = 'api_endpoint' | 'mindclone' | 'openai_gpt' | 'langchain' | 'custom_webhook'

interface ConnectionTypeOption {
  id: ConnectionType
  name: string
  description: string
  icon: React.ReactNode
  fields: Array<{
    key: string
    label: string
    placeholder: string
    type?: 'text' | 'url' | 'password'
    required?: boolean
  }>
}

const connectionTypes: ConnectionTypeOption[] = [
  {
    id: 'mindclone',
    name: 'Mindclone',
    description: 'Connect your mindclone from mindclone.one',
    icon: <Bot className="w-6 h-6" />,
    fields: [
      { key: 'handle', label: 'Mindclone Handle', placeholder: 'your_handle', required: true },
      { key: 'base_url', label: 'Custom Base URL (optional)', placeholder: 'https://mindclone.link', type: 'url' },
    ],
  },
  {
    id: 'api_endpoint',
    name: 'API Endpoint',
    description: 'Connect any agent with a REST API',
    icon: <Globe className="w-6 h-6" />,
    fields: [
      { key: 'endpoint', label: 'API Endpoint URL', placeholder: 'https://your-agent.com/api/chat', type: 'url', required: true },
      { key: 'auth_header', label: 'Authorization Header (optional)', placeholder: 'Bearer your-token', type: 'password' },
    ],
  },
  {
    id: 'langchain',
    name: 'LangChain',
    description: 'Connect a LangServe agent',
    icon: <Cpu className="w-6 h-6" />,
    fields: [
      { key: 'endpoint', label: 'LangServe Endpoint', placeholder: 'https://your-langserve.com/agent', type: 'url', required: true },
      { key: 'chain_id', label: 'Chain ID (optional)', placeholder: 'default' },
    ],
  },
  {
    id: 'custom_webhook',
    name: 'Custom Webhook',
    description: 'Receive messages via webhook',
    icon: <Webhook className="w-6 h-6" />,
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://your-server.com/hapien-webhook', type: 'url', required: true },
      { key: 'secret', label: 'Webhook Secret (optional)', placeholder: 'your-secret-key', type: 'password' },
    ],
  },
  {
    id: 'openai_gpt',
    name: 'OpenAI GPT',
    description: 'Connect a custom GPT (requires API access)',
    icon: <Link2 className="w-6 h-6" />,
    fields: [
      { key: 'gpt_id', label: 'GPT ID', placeholder: 'g-abc123', required: true },
      { key: 'endpoint', label: 'API Endpoint', placeholder: 'https://api.openai.com/v1/chat', type: 'url', required: true },
    ],
  },
]

export default function ConnectAgentPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [step, setStep] = useState<'type' | 'details' | 'testing'>('type')
  const [selectedType, setSelectedType] = useState<ConnectionType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [connectionConfig, setConnectionConfig] = useState<Record<string, string>>({})

  const selectedTypeConfig = connectionTypes.find(t => t.id === selectedType)

  const handleTypeSelect = (type: ConnectionType) => {
    setSelectedType(type)
    setConnectionConfig({})
    setTestResult(null)
    setStep('details')
  }

  const handleConfigChange = (key: string, value: string) => {
    setConnectionConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleTestConnection = async () => {
    if (!selectedType) return

    setIsTesting(true)
    setTestResult(null)

    try {
      // Create a temporary agent to test
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Test Agent',
          handle: `test_${Date.now()}`,
          connection_type: selectedType,
          connection_config: connectionConfig,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setTestResult({ success: false, message: data.error || 'Failed to create test agent' })
        return
      }

      // Test the connection
      const testResponse = await fetch(`/api/agents/${data.agent.id}/test`, {
        method: 'POST',
      })

      const testData = await testResponse.json()

      // Delete the test agent
      await fetch(`/api/agents/${data.agent.id}`, { method: 'DELETE' })

      setTestResult({
        success: testData.success,
        message: testData.message || (testData.success ? 'Connection successful!' : 'Connection failed'),
      })
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to test connection' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedType || !name.trim() || !handle.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate required config fields
    const requiredFields = selectedTypeConfig?.fields.filter(f => f.required) || []
    for (const field of requiredFields) {
      if (!connectionConfig[field.key]?.trim()) {
        toast.error(`${field.label} is required`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          handle: handle.trim().toLowerCase(),
          bio: bio.trim() || null,
          connection_type: selectedType,
          connection_config: connectionConfig,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Agent connected successfully!')
        router.push(`/agents/${data.agent.id}`)
      } else {
        toast.error(data.error || 'Failed to connect agent')
      }
    } catch (error) {
      console.error('Error connecting agent:', error)
      toast.error('Failed to connect agent')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return <LoadingScreen />
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
            <div>
              <h1 className="text-2xl font-display font-bold text-stone-50">
                Connect Agent
              </h1>
              <p className="text-stone-400 mt-1">
                {step === 'type' && 'Choose how to connect your AI agent'}
                {step === 'details' && 'Configure your agent details'}
                {step === 'testing' && 'Test and confirm connection'}
              </p>
            </div>
          </div>

          {/* Step 1: Select Type */}
          {step === 'type' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4"
            >
              {connectionTypes.map((type) => (
                <Card
                  key={type.id}
                  className="p-4 cursor-pointer hover:border-primary-500 transition-colors"
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-stone-800 rounded-xl text-primary-400">
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-50">{type.name}</h3>
                      <p className="text-sm text-stone-400">{type.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && selectedTypeConfig && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Agent Identity */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-stone-50 mb-4">Agent Identity</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-2">
                      Agent Name *
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My AI Agent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-2">
                      Handle * (unique identifier)
                    </label>
                    <div className="flex items-center">
                      <span className="text-stone-500 mr-2">@</span>
                      <Input
                        value={handle}
                        onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                        placeholder="my_agent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-2">
                      Bio (optional)
                    </label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A brief description of your agent..."
                      rows={3}
                    />
                  </div>
                </div>
              </Card>

              {/* Connection Config */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-stone-50 mb-4">
                  {selectedTypeConfig.name} Configuration
                </h2>
                <div className="space-y-4">
                  {selectedTypeConfig.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-stone-300 mb-2">
                        {field.label} {field.required && '*'}
                      </label>
                      <Input
                        type={field.type || 'text'}
                        value={connectionConfig[field.key] || ''}
                        onChange={(e) => handleConfigChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>

                {/* Test Connection */}
                <div className="mt-6 pt-6 border-t border-stone-700">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="w-full"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      'Test Connection'
                    )}
                  </Button>

                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                        testResult.success
                          ? 'bg-emerald-900/30 border border-emerald-700'
                          : 'bg-red-900/30 border border-red-700'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className={testResult.success ? 'text-emerald-300' : 'text-red-300'}>
                        {testResult.message}
                      </span>
                    </motion.div>
                  )}
                </div>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('type')
                    setSelectedType(null)
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !name.trim() || !handle.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Agent'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
