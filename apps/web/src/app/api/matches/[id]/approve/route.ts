import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../../lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/matches/[id]/approve - Approve a match
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: matchId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get match with agent ownership info
    const { data: match, error: fetchError } = await supabase
      .from('matches')
      .select(`
        *,
        agent_a:agents!matches_agent_a_id_fkey (
          owner_id,
          name,
          owner:users!agents_owner_id_fkey (id, name)
        ),
        agent_b:agents!matches_agent_b_id_fkey (
          owner_id,
          name,
          owner:users!agents_owner_id_fkey (id, name)
        )
      `)
      .eq('id', matchId)
      .single()

    if (fetchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Check if match is still pending
    if (match.status !== 'pending') {
      return NextResponse.json(
        { error: `Match is already ${match.status}` },
        { status: 400 }
      )
    }

    // Determine which side the user is on
    const isAgentAOwner = match.agent_a.owner_id === user.id
    const isAgentBOwner = match.agent_b.owner_id === user.id

    if (!isAgentAOwner && !isAgentBOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to approve this match' },
        { status: 403 }
      )
    }

    // Check if already approved
    if (isAgentAOwner && match.agent_a_owner_approved) {
      return NextResponse.json(
        { error: 'You have already approved this match' },
        { status: 400 }
      )
    }

    if (isAgentBOwner && match.agent_b_owner_approved) {
      return NextResponse.json(
        { error: 'You have already approved this match' },
        { status: 400 }
      )
    }

    // Prepare updates
    const updates: Record<string, unknown> = {}
    const now = new Date().toISOString()

    if (isAgentAOwner) {
      updates.agent_a_owner_approved = true
      updates.agent_a_owner_approved_at = now
    } else {
      updates.agent_b_owner_approved = true
      updates.agent_b_owner_approved_at = now
    }

    // Check if this makes both sides approved
    const willBothApprove =
      (isAgentAOwner && match.agent_b_owner_approved) ||
      (isAgentBOwner && match.agent_a_owner_approved)

    if (willBothApprove) {
      updates.status = 'both_approved'
    }

    // Update match
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single()

    if (updateError) {
      console.error('Error approving match:', updateError)
      return NextResponse.json(
        { error: 'Failed to approve match' },
        { status: 500 }
      )
    }

    // Create notification for the other party
    const otherUserId = isAgentAOwner ? match.agent_b.owner_id : match.agent_a.owner_id
    const yourAgentName = isAgentAOwner ? match.agent_a.name : match.agent_b.name

    if (willBothApprove) {
      // Notify both parties that the match is ready
      await supabase.from('notifications').insert([
        {
          user_id: otherUserId,
          type: 'match_approved',
          title: 'Match Confirmed!',
          body: `Both parties have approved the match. Time to schedule an intro!`,
          data: { match_id: matchId },
        },
        {
          user_id: user.id,
          type: 'match_approved',
          title: 'Match Confirmed!',
          body: `Both parties have approved the match. Time to schedule an intro!`,
          data: { match_id: matchId },
        },
      ])
    } else {
      // Notify the other party that approval is pending
      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'match_pending_approval',
        title: 'Match Awaiting Your Approval',
        body: `${yourAgentName}'s owner has approved the match. Your turn!`,
        data: { match_id: matchId },
      })
    }

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      status: willBothApprove ? 'both_approved' : 'pending_other_approval',
      message: willBothApprove
        ? 'Match confirmed! Both parties have approved.'
        : 'Approval recorded. Waiting for the other party.',
    })

  } catch (error) {
    console.error('Error in POST /api/matches/[id]/approve:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
