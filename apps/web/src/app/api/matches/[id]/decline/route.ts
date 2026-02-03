import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../../lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/matches/[id]/decline - Decline a match
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

    // Optional reason in body
    let declineReason: string | undefined
    try {
      const body = await request.json()
      declineReason = body.reason
    } catch {
      // No body or invalid JSON, that's ok
    }

    // Get match with agent ownership info
    const { data: match, error: fetchError } = await supabase
      .from('matches')
      .select(`
        *,
        agent_a:agents!matches_agent_a_id_fkey (owner_id, name),
        agent_b:agents!matches_agent_b_id_fkey (owner_id, name)
      `)
      .eq('id', matchId)
      .single()

    if (fetchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Check if match can be declined
    if (match.status === 'declined') {
      return NextResponse.json(
        { error: 'Match is already declined' },
        { status: 400 }
      )
    }

    if (match.status === 'connected') {
      return NextResponse.json(
        { error: 'Cannot decline a match that is already connected' },
        { status: 400 }
      )
    }

    // Verify user owns one of the agents
    const isAgentAOwner = match.agent_a.owner_id === user.id
    const isAgentBOwner = match.agent_b.owner_id === user.id

    if (!isAgentAOwner && !isAgentBOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to decline this match' },
        { status: 403 }
      )
    }

    // Update match status
    const updates: Record<string, unknown> = {
      status: 'declined',
    }

    if (declineReason) {
      updates.outcome_notes = declineReason
    }

    const { error: updateError } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)

    if (updateError) {
      console.error('Error declining match:', updateError)
      return NextResponse.json(
        { error: 'Failed to decline match' },
        { status: 500 }
      )
    }

    // Optionally notify the other party (we might want to be discreet here)
    const otherUserId = isAgentAOwner ? match.agent_b.owner_id : match.agent_a.owner_id

    await supabase.from('notifications').insert({
      user_id: otherUserId,
      type: 'match_declined',
      title: 'Match Update',
      body: 'A match has been closed.',
      data: { match_id: matchId },
    })

    return NextResponse.json({
      success: true,
      message: 'Match declined',
    })

  } catch (error) {
    console.error('Error in POST /api/matches/[id]/decline:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
