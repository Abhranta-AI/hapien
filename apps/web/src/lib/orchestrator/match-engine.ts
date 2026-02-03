/**
 * Match Engine
 *
 * Handles match evaluation, scoring, and surfacing matches to humans.
 * Uses conversation signals and agent metadata to determine compatibility.
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import type {
  Agent,
  Match,
  AgentConversation,
  ConversationMessage,
  Space,
} from '@hapien/shared'

import type {
  MatchEvaluation,
  MatchRecommendation,
} from './types'

/**
 * Match Engine Configuration
 */
export interface MatchEngineConfig {
  // Minimum score to consider a match
  min_match_score: number

  // Minimum turns before evaluating match
  min_turns_for_match: number

  // Use AI for match reason generation
  use_ai_reasoning: boolean
}

const DEFAULT_CONFIG: MatchEngineConfig = {
  min_match_score: 0.7,
  min_turns_for_match: 5,
  use_ai_reasoning: true,
}

/**
 * Match Engine
 */
export class MatchEngine {
  private supabase: ReturnType<typeof createClient>
  private anthropic: Anthropic | null = null
  private config: MatchEngineConfig

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: Partial<MatchEngineConfig> = {}
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Initialize Anthropic if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
    }
  }

  /**
   * Evaluate a conversation for match potential
   */
  async evaluateConversation(conversationId: string): Promise<MatchEvaluation> {
    // Get conversation with messages
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
      return {
        should_match: false,
        compatibility_score: 0,
        confidence: 0,
        reasons: ['Conversation not found'],
        highlights: [],
      }
    }

    // Get messages
    const { data: messages } = await this.supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('turn_number', { ascending: true })

    if (!messages || messages.length < this.config.min_turns_for_match) {
      return {
        should_match: false,
        compatibility_score: conversation.compatibility_score || 0,
        confidence: 0.3,
        reasons: ['Not enough conversation turns'],
        highlights: [],
      }
    }

    // Calculate match score from signals
    const signalScore = this.calculateSignalScore(messages)

    // Extract key topics and highlights
    const highlights = this.extractHighlights(messages)

    // Generate reasons
    const reasons = await this.generateMatchReasons(
      conversation as AgentConversation & { agent_a: Agent; agent_b: Agent },
      messages,
      signalScore
    )

    // Final score combines conversation score and signal score
    const finalScore = (
      (conversation.compatibility_score || 0.5) * 0.4 +
      signalScore.overall * 0.6
    )

    return {
      should_match: finalScore >= this.config.min_match_score,
      compatibility_score: finalScore,
      confidence: signalScore.confidence,
      reasons,
      highlights,
    }
  }

  /**
   * Get pending matches for a user (through their agents)
   */
  async getPendingMatches(userId: string): Promise<MatchRecommendation[]> {
    // Get user's agent IDs
    const { data: agents } = await this.supabase
      .from('agents')
      .select('id')
      .eq('owner_id', userId)

    if (!agents || agents.length === 0) {
      return []
    }

    const agentIds = agents.map(a => a.id)

    // Get pending matches involving user's agents
    const { data: matches } = await this.supabase
      .from('matches')
      .select(`
        *,
        agent_a:agents!matches_agent_a_id_fkey (
          *,
          owner:users!agents_owner_id_fkey (id, name, avatar_url)
        ),
        agent_b:agents!matches_agent_b_id_fkey (
          *,
          owner:users!agents_owner_id_fkey (id, name, avatar_url)
        ),
        space:spaces (*),
        conversation:agent_conversations (*)
      `)
      .eq('status', 'pending')
      .or(`agent_a_id.in.(${agentIds.join(',')}),agent_b_id.in.(${agentIds.join(',')})`)
      .order('compatibility_score', { ascending: false })

    if (!matches) {
      return []
    }

    return matches.map(match => this.formatMatchRecommendation(match, userId))
  }

  /**
   * Approve a match (from one side)
   */
  async approveMatch(matchId: string, userId: string): Promise<{ success: boolean; status: string }> {
    // Verify user owns one of the agents in this match
    const { data: match, error } = await this.supabase
      .from('matches')
      .select(`
        *,
        agent_a:agents!matches_agent_a_id_fkey (owner_id),
        agent_b:agents!matches_agent_b_id_fkey (owner_id)
      `)
      .eq('id', matchId)
      .single()

    if (error || !match) {
      return { success: false, status: 'Match not found' }
    }

    const isAgentAOwner = match.agent_a.owner_id === userId
    const isAgentBOwner = match.agent_b.owner_id === userId

    if (!isAgentAOwner && !isAgentBOwner) {
      return { success: false, status: 'Unauthorized' }
    }

    // Update the appropriate approval field
    const updates: Record<string, unknown> = {}
    const now = new Date().toISOString()

    if (isAgentAOwner && !match.agent_a_owner_approved) {
      updates.agent_a_owner_approved = true
      updates.agent_a_owner_approved_at = now
    } else if (isAgentBOwner && !match.agent_b_owner_approved) {
      updates.agent_b_owner_approved = true
      updates.agent_b_owner_approved_at = now
    } else {
      return { success: false, status: 'Already approved' }
    }

    // Check if both sides are now approved
    const bothApproved =
      (isAgentAOwner && match.agent_b_owner_approved) ||
      (isAgentBOwner && match.agent_a_owner_approved)

    if (bothApproved) {
      updates.status = 'both_approved'
    }

    const { error: updateError } = await this.supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)

    if (updateError) {
      return { success: false, status: 'Failed to update match' }
    }

    // Create notification for the other party if both approved
    if (bothApproved) {
      const otherUserId = isAgentAOwner ? match.agent_b.owner_id : match.agent_a.owner_id
      await this.createMatchNotification(matchId, otherUserId, 'match_approved')
    }

    return {
      success: true,
      status: bothApproved ? 'both_approved' : 'pending_other_approval',
    }
  }

  /**
   * Decline a match
   */
  async declineMatch(matchId: string, userId: string): Promise<{ success: boolean }> {
    // Verify user owns one of the agents
    const { data: match } = await this.supabase
      .from('matches')
      .select(`
        agent_a:agents!matches_agent_a_id_fkey (owner_id),
        agent_b:agents!matches_agent_b_id_fkey (owner_id)
      `)
      .eq('id', matchId)
      .single()

    if (!match) {
      return { success: false }
    }

    if (match.agent_a.owner_id !== userId && match.agent_b.owner_id !== userId) {
      return { success: false }
    }

    const { error } = await this.supabase
      .from('matches')
      .update({ status: 'declined' })
      .eq('id', matchId)

    return { success: !error }
  }

  /**
   * Schedule an intro between matched users
   */
  async scheduleIntro(
    matchId: string,
    userId: string,
    introMethod: 'video_call' | 'in_person' | 'message' | 'email',
    scheduledAt: string,
    notes?: string
  ): Promise<{ success: boolean }> {
    // Verify match is in both_approved status
    const { data: match } = await this.supabase
      .from('matches')
      .select(`
        status,
        agent_a:agents!matches_agent_a_id_fkey (owner_id),
        agent_b:agents!matches_agent_b_id_fkey (owner_id)
      `)
      .eq('id', matchId)
      .single()

    if (!match || match.status !== 'both_approved') {
      return { success: false }
    }

    if (match.agent_a.owner_id !== userId && match.agent_b.owner_id !== userId) {
      return { success: false }
    }

    const { error } = await this.supabase
      .from('matches')
      .update({
        status: 'intro_scheduled',
        intro_method: introMethod,
        intro_scheduled_at: scheduledAt,
        intro_notes: notes,
      })
      .eq('id', matchId)

    if (!error) {
      // Notify the other party
      const otherUserId =
        match.agent_a.owner_id === userId
          ? match.agent_b.owner_id
          : match.agent_a.owner_id
      await this.createMatchNotification(matchId, otherUserId, 'intro_scheduled')
    }

    return { success: !error }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private calculateSignalScore(messages: ConversationMessage[]): {
    overall: number
    confidence: number
  } {
    let totalInterest = 0
    let totalCompatibility = 0
    let positiveCount = 0
    let negativeCount = 0
    let signalCount = 0

    for (const msg of messages) {
      const meta = msg.metadata as Record<string, unknown> | null
      if (!meta) continue

      if (typeof meta.interest_score === 'number') {
        totalInterest += meta.interest_score
        signalCount++
      }

      if (typeof meta.compatibility_score === 'number') {
        totalCompatibility += meta.compatibility_score
        signalCount++
      }

      if (meta.sentiment === 'positive') positiveCount++
      if (meta.sentiment === 'negative') negativeCount++
    }

    // Calculate averages
    const avgInterest = signalCount > 0 ? totalInterest / signalCount : 0.5
    const avgCompatibility = signalCount > 0 ? totalCompatibility / signalCount : 0.5

    // Sentiment factor
    const sentimentFactor =
      (positiveCount - negativeCount) / Math.max(messages.length, 1)

    // Overall score
    const overall = (
      avgInterest * 0.3 +
      avgCompatibility * 0.5 +
      (0.5 + sentimentFactor * 0.5) * 0.2
    )

    // Confidence based on signal count
    const confidence = Math.min(signalCount / (messages.length * 2), 1)

    return { overall, confidence }
  }

  private extractHighlights(messages: ConversationMessage[]): {
    message_id: string
    summary: string
  }[] {
    // Find messages with high engagement signals
    const significantMessages = messages.filter(msg => {
      const meta = msg.metadata as Record<string, unknown> | null
      if (!meta) return false

      return (
        (meta.interest_score as number) > 0.7 ||
        (meta.compatibility_score as number) > 0.7 ||
        meta.sentiment === 'positive' ||
        ((meta.topics as string[])?.length || 0) > 2
      )
    })

    return significantMessages.slice(0, 5).map(msg => ({
      message_id: msg.id,
      summary: msg.content.length > 150
        ? msg.content.substring(0, 150) + '...'
        : msg.content,
    }))
  }

  private async generateMatchReasons(
    conversation: AgentConversation & { agent_a: Agent; agent_b: Agent },
    messages: ConversationMessage[],
    signalScore: { overall: number; confidence: number }
  ): Promise<string[]> {
    const reasons: string[] = []

    // Basic reasons from scores
    if (signalScore.overall > 0.8) {
      reasons.push('Very high mutual interest detected')
    } else if (signalScore.overall > 0.6) {
      reasons.push('Good engagement throughout conversation')
    }

    // From conversation metrics
    if ((conversation.turn_count || 0) > 10) {
      reasons.push('Extended meaningful conversation')
    }

    // Use AI for more nuanced reasoning if available
    if (this.config.use_ai_reasoning && this.anthropic && messages.length > 3) {
      try {
        const aiReasons = await this.generateAIMatchReasons(
          conversation,
          messages
        )
        reasons.push(...aiReasons)
      } catch (error) {
        console.error('Error generating AI match reasons:', error)
      }
    }

    return reasons.length > 0 ? reasons : ['Compatible profiles based on conversation']
  }

  private async generateAIMatchReasons(
    conversation: AgentConversation & { agent_a: Agent; agent_b: Agent },
    messages: ConversationMessage[]
  ): Promise<string[]> {
    if (!this.anthropic) return []

    const conversationText = messages
      .map(m => {
        const sender = m.sender_agent_id === conversation.agent_a_id
          ? conversation.agent_a.name
          : conversation.agent_b.name
        return `${sender}: ${m.content}`
      })
      .join('\n\n')

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Analyze this conversation between two AI agents representing humans and provide 2-3 brief reasons why they might be a good match. Focus on shared interests, complementary goals, or positive interaction patterns.

Conversation:
${conversationText}

Provide reasons as a JSON array of strings, e.g.: ["reason 1", "reason 2"]`,
          },
        ],
      })

      const content = response.content[0]
      if (content.type === 'text') {
        // Parse JSON array from response
        const match = content.text.match(/\[[\s\S]*\]/)
        if (match) {
          return JSON.parse(match[0]) as string[]
        }
      }
    } catch {
      // Silently fail - AI reasons are optional
    }

    return []
  }

  private formatMatchRecommendation(
    match: Match & {
      agent_a: Agent & { owner: { id: string; name: string; avatar_url: string } }
      agent_b: Agent & { owner: { id: string; name: string; avatar_url: string } }
      space: Space | null
    },
    userId: string
  ): MatchRecommendation {
    // Determine which agent is "yours" vs "theirs"
    const isAgentAOwner = match.agent_a.owner.id === userId

    return {
      match_id: match.id,
      agent_a: match.agent_a,
      agent_b: match.agent_b,
      space: match.space || undefined,
      compatibility_score: match.compatibility_score,
      match_reason: match.match_reason || 'Compatible profiles',
      conversation_highlights: (match.conversation_highlights || []).map(h => ({
        ...h,
        timestamp: new Date().toISOString(), // Placeholder
      })),
      recommended_intro_method: this.recommendIntroMethod(match),
    }
  }

  private recommendIntroMethod(
    match: Match
  ): 'video_call' | 'in_person' | 'message' | 'email' {
    // Simple heuristic - can be made smarter
    if (match.compatibility_score > 0.85) {
      return 'video_call'
    }
    if (match.compatibility_score > 0.75) {
      return 'message'
    }
    return 'email'
  }

  private async createMatchNotification(
    matchId: string,
    userId: string,
    type: 'match_approved' | 'intro_scheduled'
  ): Promise<void> {
    const titles = {
      match_approved: 'Match Approved!',
      intro_scheduled: 'Intro Scheduled',
    }

    const bodies = {
      match_approved: 'Both parties have approved the match. Time to connect!',
      intro_scheduled: 'An intro has been scheduled for your match.',
    }

    await this.supabase.from('notifications').insert({
      user_id: userId,
      type,
      title: titles[type],
      body: bodies[type],
      data: { match_id: matchId },
    })
  }
}

/**
 * Create a new match engine instance
 */
export function createMatchEngine(
  config?: Partial<MatchEngineConfig>
): MatchEngine {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }

  return new MatchEngine(supabaseUrl, supabaseKey, config)
}
