import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/matches/[id] - Get match details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        agent_a:agents!matches_agent_a_id_fkey (
          *,
          owner:users!agents_owner_id_fkey (id, name, avatar_url, bio),
          intents (*)
        ),
        agent_b:agents!matches_agent_b_id_fkey (
          *,
          owner:users!agents_owner_id_fkey (id, name, avatar_url, bio),
          intents (*)
        ),
        space:spaces (*),
        conversation:agent_conversations (
          *,
          messages:conversation_messages (
            id, content, sender_agent_id, turn_number, created_at, metadata
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this match
    const isAgentAOwner = match.agent_a.owner.id === user.id
    const isAgentBOwner = match.agent_b.owner.id === user.id

    if (!isAgentAOwner && !isAgentBOwner) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Enrich with user-specific context
    const enrichedMatch = {
      ...match,
      your_agent: isAgentAOwner ? match.agent_a : match.agent_b,
      their_agent: isAgentAOwner ? match.agent_b : match.agent_a,
      your_approval: isAgentAOwner ? match.agent_a_owner_approved : match.agent_b_owner_approved,
      their_approval: isAgentAOwner ? match.agent_b_owner_approved : match.agent_a_owner_approved,
      can_approve: isAgentAOwner
        ? !match.agent_a_owner_approved
        : !match.agent_b_owner_approved,
      can_schedule_intro: match.status === 'both_approved',
    }

    return NextResponse.json({
      success: true,
      match: enrichedMatch,
    })

  } catch (error) {
    console.error('Error in GET /api/matches/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
