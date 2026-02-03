/**
 * Agent Protocol Adapters
 *
 * Adapters for communicating with different types of AI agents.
 * Each adapter implements the AgentAdapter interface.
 */

import type {
  AgentConnectionConfig,
  ApiEndpointConfig,
  MindcloneConfig,
  LangchainConfig,
  CustomWebhookConfig,
} from '@hapien/shared'

import type {
  AgentAdapter,
  HapienMessage,
  AgentResponse,
  SendMessageResult,
} from './types'

// ============================================
// API ENDPOINT ADAPTER
// ============================================

/**
 * Adapter for agents exposed via custom API endpoints
 */
export class ApiEndpointAdapter implements AgentAdapter {
  type = 'api_endpoint' as const

  async sendMessage(
    config: AgentConnectionConfig,
    message: HapienMessage
  ): Promise<SendMessageResult> {
    const startTime = Date.now()
    const c = config as ApiEndpointConfig

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Hapien-Protocol-Version': message.protocol_version,
      }

      // Add auth header if configured
      if (c.auth_header) {
        if (c.auth_type === 'bearer') {
          headers['Authorization'] = `Bearer ${c.auth_header}`
        } else if (c.auth_type === 'api_key') {
          headers['X-API-Key'] = c.auth_header
        } else {
          headers['Authorization'] = c.auth_header
        }
      }

      const controller = new AbortController()
      const timeout = setTimeout(
        () => controller.abort(),
        c.timeout_ms || 30000
      )

      const response = await fetch(c.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(message),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const latency_ms = Date.now() - startTime

      if (!response.ok) {
        return {
          success: false,
          error: `Agent returned status ${response.status}: ${response.statusText}`,
          latency_ms,
        }
      }

      const data = await response.json()

      // Parse response - agents can return in different formats
      const agentResponse = this.parseResponse(data)

      return {
        success: true,
        response: agentResponse,
        latency_ms,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency_ms: Date.now() - startTime,
      }
    }
  }

  async healthCheck(config: AgentConnectionConfig): Promise<{
    healthy: boolean
    latency_ms: number
    error?: string
  }> {
    const startTime = Date.now()
    const c = config as ApiEndpointConfig

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(c.endpoint, {
        method: 'OPTIONS',
        signal: controller.signal,
      })

      clearTimeout(timeout)

      return {
        healthy: response.ok || response.status === 405, // 405 = Method Not Allowed is ok
        latency_ms: Date.now() - startTime,
      }
    } catch (error) {
      return {
        healthy: false,
        latency_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private parseResponse(data: unknown): AgentResponse {
    // Handle different response formats
    if (typeof data === 'string') {
      return { content: data }
    }

    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>

      // Standard Hapien format
      if ('content' in obj && typeof obj.content === 'string') {
        return {
          content: obj.content,
          signals: obj.signals as AgentResponse['signals'],
          metadata: obj.metadata as Record<string, unknown>,
        }
      }

      // OpenAI-style format
      if ('choices' in obj && Array.isArray(obj.choices)) {
        const choice = obj.choices[0] as Record<string, unknown>
        if (choice?.message && typeof choice.message === 'object') {
          const message = choice.message as Record<string, unknown>
          return { content: String(message.content || '') }
        }
      }

      // Simple message format
      if ('message' in obj && typeof obj.message === 'string') {
        return { content: obj.message }
      }

      // Response format
      if ('response' in obj && typeof obj.response === 'string') {
        return { content: obj.response }
      }

      // Text format
      if ('text' in obj && typeof obj.text === 'string') {
        return { content: obj.text }
      }
    }

    // Fallback - stringify the response
    return { content: JSON.stringify(data) }
  }
}

// ============================================
// MINDCLONE ADAPTER
// ============================================

/**
 * Adapter for mindclone.link agents
 */
export class MindcloneAdapter implements AgentAdapter {
  type = 'mindclone' as const

  async sendMessage(
    config: AgentConnectionConfig,
    message: HapienMessage
  ): Promise<SendMessageResult> {
    const startTime = Date.now()
    const c = config as MindcloneConfig

    try {
      const baseUrl = c.base_url || 'https://mindclone.link'
      const endpoint = `${baseUrl}/api/v1/chat/${c.handle}`

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      // Mindclone expects a specific format
      const mindclonePayload = {
        message: message.content,
        context: {
          source: 'hapien',
          conversation_id: message.conversation_id,
          space: message.context.space_name,
          intent: message.context.your_intent?.title,
        },
        metadata: {
          protocol_version: message.protocol_version,
          turn: message.turn_number,
        },
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hapien-Protocol-Version': message.protocol_version,
        },
        body: JSON.stringify(mindclonePayload),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const latency_ms = Date.now() - startTime

      if (!response.ok) {
        return {
          success: false,
          error: `Mindclone returned status ${response.status}`,
          latency_ms,
        }
      }

      const data = await response.json()

      return {
        success: true,
        response: this.parseResponse(data),
        latency_ms,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency_ms: Date.now() - startTime,
      }
    }
  }

  async healthCheck(config: AgentConnectionConfig): Promise<{
    healthy: boolean
    latency_ms: number
    error?: string
  }> {
    const startTime = Date.now()
    const c = config as MindcloneConfig

    try {
      const baseUrl = c.base_url || 'https://mindclone.link'
      const endpoint = `${baseUrl}/${c.handle}`

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
      })

      clearTimeout(timeout)

      return {
        healthy: response.ok,
        latency_ms: Date.now() - startTime,
      }
    } catch (error) {
      return {
        healthy: false,
        latency_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private parseResponse(data: unknown): AgentResponse {
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>

      // Mindclone response format
      if ('reply' in obj && typeof obj.reply === 'string') {
        return {
          content: obj.reply,
          signals: obj.signals as AgentResponse['signals'],
        }
      }

      if ('response' in obj && typeof obj.response === 'string') {
        return { content: obj.response }
      }

      if ('message' in obj && typeof obj.message === 'string') {
        return { content: obj.message }
      }
    }

    if (typeof data === 'string') {
      return { content: data }
    }

    return { content: JSON.stringify(data) }
  }
}

// ============================================
// LANGCHAIN ADAPTER
// ============================================

/**
 * Adapter for LangChain/LangServe agents
 */
export class LangchainAdapter implements AgentAdapter {
  type = 'langchain' as const

  async sendMessage(
    config: AgentConnectionConfig,
    message: HapienMessage
  ): Promise<SendMessageResult> {
    const startTime = Date.now()
    const c = config as LangchainConfig

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000) // LangChain can be slow

      // LangServe expects input in a specific format
      const langchainPayload = {
        input: {
          human_input: message.content,
          chat_history: [],
          context: {
            hapien_conversation_id: message.conversation_id,
            hapien_space: message.context.space_name,
            hapien_intent: message.context.your_intent,
            from_agent: message.from_agent,
          },
        },
        config: {
          configurable: {
            chain_id: c.chain_id,
          },
        },
      }

      const response = await fetch(`${c.endpoint}/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(langchainPayload),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const latency_ms = Date.now() - startTime

      if (!response.ok) {
        return {
          success: false,
          error: `LangChain agent returned status ${response.status}`,
          latency_ms,
        }
      }

      const data = await response.json()

      return {
        success: true,
        response: this.parseResponse(data),
        latency_ms,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency_ms: Date.now() - startTime,
      }
    }
  }

  async healthCheck(config: AgentConnectionConfig): Promise<{
    healthy: boolean
    latency_ms: number
    error?: string
  }> {
    const startTime = Date.now()
    const c = config as LangchainConfig

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      // LangServe has a health endpoint
      const response = await fetch(`${c.endpoint}/health`, {
        method: 'GET',
        signal: controller.signal,
      })

      clearTimeout(timeout)

      return {
        healthy: response.ok,
        latency_ms: Date.now() - startTime,
      }
    } catch (error) {
      return {
        healthy: false,
        latency_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private parseResponse(data: unknown): AgentResponse {
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>

      // LangServe response format
      if ('output' in obj) {
        const output = obj.output
        if (typeof output === 'string') {
          return { content: output }
        }
        if (typeof output === 'object' && output !== null) {
          const outputObj = output as Record<string, unknown>
          if ('content' in outputObj && typeof outputObj.content === 'string') {
            return { content: outputObj.content }
          }
          if ('response' in outputObj && typeof outputObj.response === 'string') {
            return { content: outputObj.response }
          }
        }
      }
    }

    if (typeof data === 'string') {
      return { content: data }
    }

    return { content: JSON.stringify(data) }
  }
}

// ============================================
// CUSTOM WEBHOOK ADAPTER
// ============================================

/**
 * Adapter for custom webhook-based agents
 */
export class CustomWebhookAdapter implements AgentAdapter {
  type = 'custom_webhook' as const

  async sendMessage(
    config: AgentConnectionConfig,
    message: HapienMessage
  ): Promise<SendMessageResult> {
    const startTime = Date.now()
    const c = config as CustomWebhookConfig

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Hapien-Protocol-Version': message.protocol_version,
      }

      if (c.secret) {
        headers['X-Hapien-Signature'] = c.secret
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(c.webhook_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(message),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const latency_ms = Date.now() - startTime

      if (!response.ok) {
        return {
          success: false,
          error: `Webhook returned status ${response.status}`,
          latency_ms,
        }
      }

      const data = await response.json()

      return {
        success: true,
        response: this.parseResponse(data),
        latency_ms,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency_ms: Date.now() - startTime,
      }
    }
  }

  async healthCheck(config: AgentConnectionConfig): Promise<{
    healthy: boolean
    latency_ms: number
    error?: string
  }> {
    const startTime = Date.now()
    const c = config as CustomWebhookConfig

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(c.webhook_url, {
        method: 'HEAD',
        signal: controller.signal,
      })

      clearTimeout(timeout)

      return {
        healthy: response.ok || response.status === 405,
        latency_ms: Date.now() - startTime,
      }
    } catch (error) {
      return {
        healthy: false,
        latency_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private parseResponse(data: unknown): AgentResponse {
    if (typeof data === 'string') {
      return { content: data }
    }

    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>

      if ('content' in obj && typeof obj.content === 'string') {
        return {
          content: obj.content,
          signals: obj.signals as AgentResponse['signals'],
          metadata: obj.metadata as Record<string, unknown>,
        }
      }

      if ('message' in obj && typeof obj.message === 'string') {
        return { content: obj.message }
      }

      if ('response' in obj && typeof obj.response === 'string') {
        return { content: obj.response }
      }
    }

    return { content: JSON.stringify(data) }
  }
}

// ============================================
// ADAPTER REGISTRY
// ============================================

import type { AgentConnectionType } from '@hapien/shared'

const adapters: Record<AgentConnectionType, AgentAdapter> = {
  api_endpoint: new ApiEndpointAdapter(),
  mindclone: new MindcloneAdapter(),
  openai_gpt: new ApiEndpointAdapter(), // GPTs use API endpoint format
  langchain: new LangchainAdapter(),
  custom_webhook: new CustomWebhookAdapter(),
}

/**
 * Get the appropriate adapter for an agent type
 */
export function getAdapter(type: AgentConnectionType): AgentAdapter {
  const adapter = adapters[type]
  if (!adapter) {
    throw new Error(`No adapter found for agent type: ${type}`)
  }
  return adapter
}

/**
 * Send a message to an agent using the appropriate adapter
 */
export async function sendMessageToAgent(
  type: AgentConnectionType,
  config: AgentConnectionConfig,
  message: HapienMessage
): Promise<SendMessageResult> {
  const adapter = getAdapter(type)
  return adapter.sendMessage(config, message)
}

/**
 * Check agent health using the appropriate adapter
 */
export async function checkAgentHealth(
  type: AgentConnectionType,
  config: AgentConnectionConfig
): Promise<{ healthy: boolean; latency_ms: number; error?: string }> {
  const adapter = getAdapter(type)
  return adapter.healthCheck(config)
}
