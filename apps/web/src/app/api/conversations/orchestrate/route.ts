import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../lib/supabase/server'
import { createOrchestrator, createMatchEngine } from '../../../../lib/orchestrator'

/**
 * POST /api/conversations/orchestrate
 *
 * Triggers conversation orchestration for a space.
 * This endpoint can be called manually or via cron to:
 * 1. Find potential agent pairs
 * 2. Start new conversations
 * 3. Continue existing conversations
 * 4. Evaluate matches
 *
 * In production, this would typically be called by a background job.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // This endpoint requires authentication
    // In production, you'd also want to check for admin/system role
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      space_id,
      action = 'full_cycle', // 'find_pairs' | 'start_conversations' | 'continue_conversations' | 'evaluate_matches' | 'full_cycle'
      max_new_conversations = 5,
      max_continue = 10,
    } = body as {
      space_id?: string
      action?: string
      max_new_conversations?: number
      max_continue?: number
    }

    const results: Record<string, unknown> = {
      action,
      timestamp: new Date().toISOString(),
    }

    // Create orchestrator and match engine
    const orchestrator = createOrchestrator()
    const matchEngine = createMatchEngine()

    // If space_id provided, only operate on that space
    // Otherwise, operate on all public spaces
    let spaceIds: string[] = []

    if (space_id) {
      spaceIds = [space_id]
    } else {
      const { data: spaces } = await supabase
        .from('spaces')
        .select('id')
        .eq('is_public', true)
        .gt('agent_count', 1) // Only spaces with at least 2 agents

      spaceIds = spaces?.map(s => s.id) || []
    }

    if (spaceIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible spaces found',
        results,
      })
    }

    results.spaces_processed = spaceIds.length

    // STEP 1: Find potential pairs and start new conversations
    if (action === 'find_pairs' || action === 'start_conversations' || action === 'full_cycle') {
      const newConversations: string[] = []

      for (const spaceId of spaceIds) {
        if (newConversations.length >= max_new_conversations) break

        const pairs = await orchestrator.findPotentialPairs(spaceId, 3)

        for (const pair of pairs) {
          if (newConversations.length >= max_new_conversations) break

          const conversation = await orchestrator.startConversation(pair)
          if (conversation) {
            newConversations.push(conversation.id)
          }
        }
      }

      results.new_conversations = newConversations.length
      results.new_conversation_ids = newConversations
    }

    // STEP 2: Continue existing active conversations
    if (action === 'continue_conversations' || action === 'full_cycle') {
      // Get active conversations that haven't been updated recently
      const cutoffTime = new Date(Date.now() - 60000).toISOString() // 1 minute ago

      const { data: activeConversations } = await supabase
        .from('agent_conversations')
        .select('id')
        .eq('status', 'active')
        .lt('last_message_at', cutoffTime)
        .order('last_message_at', { ascending: true })
        .limit(max_continue)

      const continuedConversations: string[] = []
      const matchProposals: string[] = []

      for (const conv of activeConversations || []) {
        const turnResult = await orchestrator.continueConversation(conv.id)

        if (turnResult) {
          continuedConversations.push(conv.id)

          if (turnResult.should_match) {
            const matchId = await orchestrator.proposeMatch(conv.id)
            if (matchId) {
              matchProposals.push(matchId)
            }
          } else if (!turnResult.should_continue) {
            await orchestrator.concludeConversation(conv.id, 'completed')
          }
        }
      }

      results.continued_conversations = continuedConversations.length
      results.match_proposals = matchProposals.length
    }

    // STEP 3: Evaluate conversations for matches
    if (action === 'evaluate_matches' || action === 'full_cycle') {
      // Get conversations that might be ready for matching
      const { data: matureConversations } = await supabase
        .from('agent_conversations')
        .select('id')
        .eq('status', 'active')
        .gte('turn_count', 5)
        .gte('compatibility_score', 0.6)
        .limit(10)

      const evaluations: { conversation_id: string; should_match: boolean; score: number }[] = []

      for (const conv of matureConversations || []) {
        const evaluation = await matchEngine.evaluateConversation(conv.id)

        evaluations.push({
          conversation_id: conv.id,
          should_match: evaluation.should_match,
          score: evaluation.compatibility_score,
        })

        if (evaluation.should_match) {
          await orchestrator.proposeMatch(conv.id)
        }
      }

      results.evaluations = evaluations
    }

    return NextResponse.json({
      success: true,
      message: 'Orchestration completed',
      results,
    })

  } catch (error) {
    console.error('Error in POST /api/conversations/orchestrate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/conversations/orchestrate
 *
 * Get orchestration status and stats
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get overall stats
    const [
      { count: totalConversations },
      { count: activeConversations },
      { count: totalMatches },
      { count: pendingMatches },
    ] = await Promise.all([
      supabase.from('agent_conversations').select('*', { count: 'exact', head: true }),
      supabase.from('agent_conversations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    // Get per-space stats
    const { data: spaceStats } = await supabase
      .from('spaces')
      .select('id, name, agent_count, conversation_count, match_count')
      .eq('is_public', true)
      .order('agent_count', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      stats: {
        total_conversations: totalConversations,
        active_conversations: activeConversations,
        total_matches: totalMatches,
        pending_matches: pendingMatches,
      },
      space_stats: spaceStats,
    })

  } catch (error) {
    console.error('Error in GET /api/conversations/orchestrate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
