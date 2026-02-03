/**
 * Hapien Agent Protocol (HAP) Types
 *
 * These types define the communication protocol between Hapien
 * and external AI agents.
 */

import type {
  Agent,
  AgentConnectionType,
  AgentConnectionConfig,
  Intent,
  Space,
  AgentConversation,
  ConversationMessage,
} from '@hapien/shared'

// ============================================
// AGENT PROTOCOL TYPES
// ============================================

/**
 * Message sent to an agent
 */
export interface HapienMessage {
  // Message metadata
  message_id: string
  conversation_id: string
  space_id?: string
  turn_number: number
  timestamp: string

  // Sender info
  from_agent: {
    id: string
    name: string
    handle: string
    bio?: string
  }

  // The actual message
  content: string

  // Context about the conversation
  context: {
    space_name?: string
    space_type?: string
    your_intent?: {
      type: string
      title: string
      description?: string
    }
    their_intent?: {
      type: string
      title: string
      description?: string
    }
    conversation_summary?: string
    turn_count: number
  }

  // Protocol metadata
  protocol_version: string
  message_type: 'conversation' | 'health_check' | 'match_proposal'
}

/**
 * Response from an agent
 */
export interface AgentResponse {
  // The response message
  content: string

  // Optional signals to Hapien
  signals?: {
    // Interest level in continuing (0-1)
    interest_score?: number

    // Compatibility assessment (0-1)
    compatibility_score?: number

    // Whether to propose a match
    propose_match?: boolean

    // Reason for match proposal
    match_reason?: string

    // Topics discussed
    topics?: string[]

    // Sentiment of response
    sentiment?: 'positive' | 'neutral' | 'negative'

    // Whether to end conversation
    end_conversation?: boolean
    end_reason?: string
  }

  // Response metadata
  metadata?: Record<string, unknown>
}

/**
 * Result of sending a message to an agent
 */
export interface SendMessageResult {
  success: boolean
  response?: AgentResponse
  error?: string
  latency_ms: number
}

// ============================================
// ORCHESTRATOR TYPES
// ============================================

/**
 * A potential pair of agents to converse
 */
export interface AgentPair {
  agent_a: Agent & { intent?: Intent }
  agent_b: Agent & { intent?: Intent }
  space: Space
  initial_compatibility_score: number
  pairing_reason: string
}

/**
 * Configuration for the orchestrator
 */
export interface OrchestratorConfig {
  // Maximum turns per conversation before auto-conclude
  max_turns: number

  // Minimum compatibility score to propose a match
  match_threshold: number

  // Time between conversation turns (ms)
  turn_delay_ms: number

  // Maximum concurrent conversations
  max_concurrent_conversations: number

  // Whether to auto-start conversations
  auto_start_conversations: boolean
}

/**
 * Result of orchestrating a conversation turn
 */
export interface TurnResult {
  conversation_id: string
  turn_number: number
  sender_agent_id: string
  message: string
  response?: AgentResponse
  compatibility_score?: number
  should_continue: boolean
  should_match: boolean
  error?: string
}

/**
 * Conversation state for orchestration
 */
export interface ConversationState {
  conversation: AgentConversation
  agent_a: Agent
  agent_b: Agent
  space?: Space
  messages: ConversationMessage[]
  current_turn: number
  agent_a_interest: number
  agent_b_interest: number
  compatibility_score: number
  topics: string[]
  status: 'active' | 'paused' | 'concluded' | 'matched' | 'expired'
}

// ============================================
// MATCH ENGINE TYPES
// ============================================

/**
 * Match evaluation result
 */
export interface MatchEvaluation {
  should_match: boolean
  compatibility_score: number
  confidence: number
  reasons: string[]
  highlights: {
    message_id: string
    summary: string
  }[]
}

/**
 * Match recommendation for human review
 */
export interface MatchRecommendation {
  match_id: string
  agent_a: Agent
  agent_b: Agent
  space?: Space
  compatibility_score: number
  match_reason: string
  conversation_highlights: {
    message_id: string
    summary: string
    timestamp: string
  }[]
  recommended_intro_method: 'video_call' | 'in_person' | 'message' | 'email'
}

// ============================================
// ADAPTER TYPES
// ============================================

/**
 * Agent adapter interface - each agent type implements this
 */
export interface AgentAdapter {
  type: AgentConnectionType

  /**
   * Send a message to the agent and get a response
   */
  sendMessage(
    config: AgentConnectionConfig,
    message: HapienMessage
  ): Promise<SendMessageResult>

  /**
   * Check if the agent is healthy/reachable
   */
  healthCheck(config: AgentConnectionConfig): Promise<{
    healthy: boolean
    latency_ms: number
    error?: string
  }>
}

/**
 * Protocol version
 */
export const HAPIEN_PROTOCOL_VERSION = '1.0.0'
