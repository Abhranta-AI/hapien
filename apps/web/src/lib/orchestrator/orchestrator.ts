/**
 * Conversation Orchestrator
 *
 * Manages agent-to-agent conversations, including:
 * - Finding potential agent pairs
 * - Initiating conversations
 * - Managing turn-based dialogue
 * - Detecting match opportunities
 */

import { createClient } from '@supabase/supabase-js'
import type {
  Agent,
  Intent,
  Space,
  AgentConversation,
  AgentConnectionType,
  AgentConnectionConfig,
} from '@hapien/shared'

import {
  sendMessageToAgent,
} from './adapters'

import type {
  HapienMessage,
  AgentResponse,
  AgentPair,
  OrchestratorConfig,
  TurnResult,
  ConversationState,
  HAPIEN_PROTOCOL_VERSION,
} from './types'

// Default configuration
const DEFAULT_CONFIG: OrchestratorConfig = {
  max_turns: 20,
  match_threshold: 0.75,
  turn_delay_ms: 1000,
  max_concurrent_conversations: 100,
  auto_start_conversations: false,
}

/**
 * Conversation Orchestrator
 */
export class ConversationOrchestrator {
  private supabase: ReturnType<typeof createClient>
  private config: OrchestratorConfig

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: Partial<OrchestratorConfig> = {}
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Find potential agent pairs in a space based on complementary intents
   */
  async findPotentialPairs(spaceId: string, limit: number = 10): Promise<AgentPair[]> {
    // Get all active agents in the space with their intents
    const { data: memberships, error } = await this.supabase
      .from('space_memberships')
      .select(`
        agent:agents (
          *,
          intents (*)
        ),
        intent:intents (*)
      `)
      .eq('space_id', spaceId)
      .eq('is_active', true)

    if (error || !memberships) {
      console.error('Error fetching space memberships:', error)
      return []
    }

    // Get space info
    const { data: space } = await this.supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single()

    if (!space) {
      return []
    }

    // Get existing active conversations to avoid duplicates
    const { data: existingConversations } = await this.supabase
      .from('agent_conversations')
      .select('agent_a_id, agent_b_id')
      .eq('space_id', spaceId)
      .in('status', ['active', 'paused'])

    const existingPairs = new Set(
      (existingConversations || []).map(c =>
        [c.agent_a_id, c.agent_b_id].sort().join('-')
      )
    )

    // Find complementary pairs
    const pairs: AgentPair[] = []
    const agents = memberships
      .map(m => ({
        agent: m.agent as Agent & { intents?: Intent[] },
        intent: m.intent as Intent | null,
      }))
      .filter(a => a.agent && a.agent.is_active)

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const agentA = agents[i]
        const agentB = agents[j]

        // Skip if already in conversation
        const pairKey = [agentA.agent.id, agentB.agent.id].sort().join('-')
        if (existingPairs.has(pairKey)) {
          continue
        }

        // Skip if same owner
        if (agentA.agent.owner_id === agentB.agent.owner_id) {
          continue
        }

        // Calculate initial compatibility
        const compatibility = this.calculateInitialCompatibility(
          agentA.agent,
          agentA.intent || agentA.agent.intents?.[0],
          agentB.agent,
          agentB.intent || agentB.agent.intents?.[0],
          space
        )

        if (compatibility.score > 0.3) { // Minimum threshold to consider
          pairs.push({
            agent_a: { ...agentA.agent, intent: agentA.intent || agentA.agent.intents?.[0] },
            agent_b: { ...agentB.agent, intent: agentB.intent || agentB.agent.intents?.[0] },
            space: space as Space,
            initial_compatibility_score: compatibility.score,
            pairing_reason: compatibility.reason,
          })
        }
      }
    }

    // Sort by compatibility and return top pairs
    return pairs
      .sort((a, b) => b.initial_compatibility_score - a.initial_compatibility_score)
      .slice(0, limit)
  }

  /**
   * Start a new conversation between two agents
   */
  async startConversation(pair: AgentPair): Promise<AgentConversation | null> {
    // Create conversation record
    const { data: conversation, error } = await this.supabase
      .from('agent_conversations')
      .insert({
        space_id: pair.space.id,
        agent_a_id: pair.agent_a.id,
        agent_b_id: pair.agent_b.id,
        agent_a_intent_id: pair.agent_a.intent?.id || null,
        agent_b_intent_id: pair.agent_b.intent?.id || null,
        status: 'active',
        turn_count: 0,
        compatibility_score: pair.initial_compatibility_score,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !conversation) {
      console.error('Error creating conversation:', error)
      return null
    }

    // Generate and send opening message from agent A
    const openingMessage = this.generateOpeningMessage(pair)

    // Send to agent B and get response
    const result = await this.executeTurn(
      conversation as AgentConversation,
      pair.agent_a,
      pair.agent_b,
      openingMessage,
      pair.space,
      1
    )

    if (!result.success) {
      // Mark conversation as failed if first message fails
      await this.supabase
        .from('agent_conversations')
        .update({ status: 'concluded', concluded_at: new Date().toISOString() })
        .eq('id', conversation.id)
    }

    return conversation as AgentConversation
  }

  /**
   * Execute a single turn in a conversation
   */
  async executeTurn(
    conversation: AgentConversation,
    senderAgent: Agent,
    receiverAgent: Agent,
    messageContent: string,
    space: Space | undefined,
    turnNumber: number
  ): Promise<TurnResult> {
    // Build the message
    const message: HapienMessage = {
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversation_id: conversation.id,
      space_id: space?.id,
      turn_number: turnNumber,
      timestamp: new Date().toISOString(),
      from_agent: {
        id: senderAgent.id,
        name: senderAgent.name,
        handle: senderAgent.handle,
        bio: senderAgent.bio || undefined,
      },
      content: messageContent,
      context: {
        space_name: space?.name,
        space_type: space?.type,
        turn_count: turnNumber,
      },
      protocol_version: '1.0.0',
      message_type: 'conversation',
    }

    // Store the outgoing message
    await this.supabase.from('conversation_messages').insert({
      conversation_id: conversation.id,
      sender_agent_id: senderAgent.id,
      content: messageContent,
      turn_number: turnNumber,
      metadata: {},
    })

    // Send to receiver agent
    const result = await sendMessageToAgent(
      receiverAgent.connection_type as AgentConnectionType,
      receiverAgent.connection_config as AgentConnectionConfig,
      message
    )

    if (!result.success || !result.response) {
      return {
        conversation_id: conversation.id,
        turn_number: turnNumber,
        sender_agent_id: senderAgent.id,
        message: messageContent,
        should_continue: false,
        should_match: false,
        error: result.error || 'No response from agent',
      }
    }

    // Store the response
    const responseMetadata = {
      interest_score: result.response.signals?.interest_score,
      compatibility_score: result.response.signals?.compatibility_score,
      topics: result.response.signals?.topics,
      sentiment: result.response.signals?.sentiment,
    }

    await this.supabase.from('conversation_messages').insert({
      conversation_id: conversation.id,
      sender_agent_id: receiverAgent.id,
      content: result.response.content,
      turn_number: turnNumber,
      metadata: responseMetadata,
    })

    // Update conversation stats
    const newCompatibility = this.updateCompatibilityScore(
      conversation.compatibility_score || 0.5,
      result.response
    )

    await this.supabase
      .from('agent_conversations')
      .update({
        turn_count: turnNumber,
        last_message_at: new Date().toISOString(),
        compatibility_score: newCompatibility,
        agent_b_interest_score: result.response.signals?.interest_score,
      })
      .eq('id', conversation.id)

    // Determine if we should continue or match
    const shouldMatch =
      result.response.signals?.propose_match ||
      (newCompatibility >= this.config.match_threshold && turnNumber >= 5)

    const shouldContinue =
      !shouldMatch &&
      !result.response.signals?.end_conversation &&
      turnNumber < this.config.max_turns &&
      (result.response.signals?.interest_score ?? 0.5) > 0.3

    return {
      conversation_id: conversation.id,
      turn_number: turnNumber,
      sender_agent_id: senderAgent.id,
      message: messageContent,
      response: result.response,
      compatibility_score: newCompatibility,
      should_continue: shouldContinue,
      should_match: shouldMatch,
    }
  }

  /**
   * Continue an existing conversation with the next turn
   */
  async continueConversation(conversationId: string): Promise<TurnResult | null> {
    // Get conversation with agents
    const { data: conversation, error } = await this.supabase
      .from('agent_conversations')
      .select(`
        *,
        agent_a:agents!agent_conversations_agent_a_id_fkey (*),
        agent_b:agents!agent_conversations_agent_b_id_fkey (*),
        space:spaces (*)
      `)
      .eq('id', conversationId)
      .single()

    if (error || !conversation) {
      console.error('Error fetching conversation:', error)
      return null
    }

    if (conversation.status !== 'active') {
      return null
    }

    // Get last message to determine who speaks next
    const { data: lastMessage } = await this.supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('turn_number', { ascending: false })
      .limit(1)
      .single()

    const lastSenderId = lastMessage?.sender_agent_id
    const nextSender =
      lastSenderId === conversation.agent_a_id
        ? conversation.agent_b
        : conversation.agent_a
    const nextReceiver =
      lastSenderId === conversation.agent_a_id
        ? conversation.agent_a
        : conversation.agent_b

    // Get conversation history for context
    const { data: messages } = await this.supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('turn_number', { ascending: true })
      .limit(10)

    // Generate next message based on conversation history
    const nextMessage = this.generateFollowUpMessage(
      nextSender as Agent,
      nextReceiver as Agent,
      messages || [],
      conversation.space as Space | null
    )

    const turnNumber = (conversation.turn_count || 0) + 1

    return this.executeTurn(
      conversation as AgentConversation,
      nextSender as Agent,
      nextReceiver as Agent,
      nextMessage,
      conversation.space as Space | undefined,
      turnNumber
    )
  }

  /**
   * Conclude a conversation
   */
  async concludeConversation(
    conversationId: string,
    reason: 'completed' | 'no_interest' | 'timeout' | 'error'
  ): Promise<void> {
    await this.supabase
      .from('agent_conversations')
      .update({
        status: 'concluded',
        concluded_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  }

  /**
   * Propose a match from a conversation
   */
  async proposeMatch(conversationId: string): Promise<string | null> {
    const { data: conversation } = await this.supabase
      .from('agent_conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return null
    }

    // Get conversation highlights
    const { data: messages } = await this.supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('turn_number', { ascending: true })

    const highlights = this.extractHighlights(messages || [])

    // Create match record
    const { data: match, error } = await this.supabase
      .from('matches')
      .insert({
        conversation_id: conversationId,
        space_id: conversation.space_id,
        agent_a_id: conversation.agent_a_id,
        agent_b_id: conversation.agent_b_id,
        compatibility_score: conversation.compatibility_score || 0.5,
        match_reason: 'High compatibility detected through conversation',
        conversation_highlights: highlights,
        status: 'pending',
      })
      .select()
      .single()

    if (error || !match) {
      console.error('Error creating match:', error)
      return null
    }

    // Update conversation status
    await this.supabase
      .from('agent_conversations')
      .update({ status: 'matched' })
      .eq('id', conversationId)

    return match.id
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private calculateInitialCompatibility(
    agentA: Agent,
    intentA: Intent | undefined,
    agentB: Agent,
    intentB: Intent | undefined,
    space: Space
  ): { score: number; reason: string } {
    let score = 0.5 // Base score
    const reasons: string[] = []

    // Check intent compatibility
    if (intentA && intentB) {
      // Complementary intents (e.g., founder seeking investor + investor seeking startups)
      if (this.areIntentsComplementary(intentA.type, intentB.type)) {
        score += 0.2
        reasons.push('Complementary intents')
      }

      // Same type but different sides (e.g., both looking for cofounders)
      if (intentA.type === intentB.type) {
        score += 0.1
        reasons.push('Shared goals')
      }
    }

    // Both verified agents get a boost
    if (agentA.is_verified && agentB.is_verified) {
      score += 0.1
      reasons.push('Both verified')
    }

    // Active agents with history
    if ((agentA.total_conversations || 0) > 5 && (agentB.total_conversations || 0) > 5) {
      score += 0.1
      reasons.push('Experienced agents')
    }

    return {
      score: Math.min(score, 1),
      reason: reasons.join(', ') || 'Standard pairing',
    }
  }

  private areIntentsComplementary(typeA: string, typeB: string): boolean {
    const complementaryPairs = [
      ['investment', 'investment'], // Founders and investors both have investment intent
      ['hiring', 'collaboration'], // Hiring and job seeking
      ['mentorship', 'mentorship'], // Mentors and mentees
    ]

    return complementaryPairs.some(
      pair =>
        (pair[0] === typeA && pair[1] === typeB) ||
        (pair[1] === typeA && pair[0] === typeB)
    )
  }

  private generateOpeningMessage(pair: AgentPair): string {
    const agentA = pair.agent_a
    const intentA = pair.agent_a.intent

    let message = `Hi! I'm ${agentA.name}, representing my human on Hapien.`

    if (agentA.bio) {
      message += ` ${agentA.bio}`
    }

    if (intentA) {
      message += ` I'm here because ${intentA.title.toLowerCase()}.`
      if (intentA.description) {
        message += ` ${intentA.description}`
      }
    }

    message += ` I'd love to learn more about you and see if there might be a good connection here. What brings you to ${pair.space.name}?`

    return message
  }

  private generateFollowUpMessage(
    sender: Agent,
    receiver: Agent,
    history: Array<{ content: string; sender_agent_id: string }>,
    space: Space | null
  ): string {
    // This is a simple implementation - in production, you'd use an LLM
    // to generate contextual follow-up messages

    const lastMessage = history[history.length - 1]

    if (!lastMessage) {
      return `Hi ${receiver.name}! I'm ${sender.name}. Tell me more about yourself!`
    }

    // Simple response generation based on turn count
    const turnCount = history.length

    if (turnCount < 3) {
      return `That's interesting! Can you tell me more about your background and what you're hoping to achieve?`
    }

    if (turnCount < 6) {
      return `I appreciate you sharing that. Based on what you've said, I think there could be some interesting synergies. What are your thoughts on potential collaboration?`
    }

    if (turnCount < 10) {
      return `This conversation has been really valuable. I'm seeing some strong alignment between us. Would you be open to connecting our humans for a more direct conversation?`
    }

    return `I think we've covered a lot of ground. My human would definitely be interested in continuing this conversation. Should we propose a match?`
  }

  private updateCompatibilityScore(
    currentScore: number,
    response: AgentResponse
  ): number {
    let adjustment = 0

    // Adjust based on interest signal
    if (response.signals?.interest_score !== undefined) {
      adjustment += (response.signals.interest_score - 0.5) * 0.1
    }

    // Adjust based on compatibility signal
    if (response.signals?.compatibility_score !== undefined) {
      adjustment += (response.signals.compatibility_score - 0.5) * 0.1
    }

    // Adjust based on sentiment
    if (response.signals?.sentiment === 'positive') {
      adjustment += 0.05
    } else if (response.signals?.sentiment === 'negative') {
      adjustment -= 0.1
    }

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, currentScore + adjustment))
  }

  private extractHighlights(
    messages: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>
  ): Array<{ message_id: string; summary: string }> {
    // Extract messages with high interest scores or important topics
    return messages
      .filter(m => {
        const meta = m.metadata || {}
        return (
          (meta.interest_score as number) > 0.7 ||
          ((meta.topics as string[])?.length || 0) > 0
        )
      })
      .slice(0, 5)
      .map(m => ({
        message_id: m.id,
        summary: m.content.substring(0, 200) + (m.content.length > 200 ? '...' : ''),
      }))
  }
}

/**
 * Create a new orchestrator instance
 */
export function createOrchestrator(
  config?: Partial<OrchestratorConfig>
): ConversationOrchestrator {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }

  return new ConversationOrchestrator(supabaseUrl, supabaseKey, config)
}
