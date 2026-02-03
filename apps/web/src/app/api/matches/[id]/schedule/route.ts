import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../../lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/matches/[id]/schedule - Schedule an intro for a match
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

    const body = await request.json()
    const {
      intro_method,
      scheduled_at,
      notes,
    } = body as {
      intro_method: 'video_call' | 'in_person' | 'message' | 'email'
      scheduled_at: string
      notes?: string
    }

    // Validate required fields
    const validMethods = ['video_call', 'in_person', 'message', 'email']
    if (!intro_method || !validMethods.includes(intro_method)) {
      return NextResponse.json(
        { error: 'Valid intro_method is required (video_call, in_person, message, email)' },
        { status: 400 }
      )
    }

    if (!scheduled_at) {
      return NextResponse.json(
        { error: 'scheduled_at is required' },
        { status: 400 }
      )
    }

    // Validate scheduled_at is a valid future date
    const scheduledDate = new Date(scheduled_at)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid scheduled_at date format' },
        { status: 400 }
      )
    }

    if (scheduledDate < new Date()) {
      return NextResponse.json(
        { error: 'scheduled_at must be in the future' },
        { status: 400 }
      )
    }

    // Get match
    const { data: match, error: fetchError } = await supabase
      .from('matches')
      .select(`
        *,
        agent_a:agents!matches_agent_a_id_fkey (
          owner_id,
          name,
          owner:users!agents_owner_id_fkey (id, name, email)
        ),
        agent_b:agents!matches_agent_b_id_fkey (
          owner_id,
          name,
          owner:users!agents_owner_id_fkey (id, name, email)
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

    // Check if match is ready for scheduling
    if (match.status !== 'both_approved') {
      return NextResponse.json(
        { error: `Cannot schedule intro - match status is ${match.status}. Both parties must approve first.` },
        { status: 400 }
      )
    }

    // Verify user is part of this match
    const isAgentAOwner = match.agent_a.owner_id === user.id
    const isAgentBOwner = match.agent_b.owner_id === user.id

    if (!isAgentAOwner && !isAgentBOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to schedule this intro' },
        { status: 403 }
      )
    }

    // Update match with intro details
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update({
        status: 'intro_scheduled',
        intro_method,
        intro_scheduled_at: scheduled_at,
        intro_notes: notes || null,
      })
      .eq('id', matchId)
      .select()
      .single()

    if (updateError) {
      console.error('Error scheduling intro:', updateError)
      return NextResponse.json(
        { error: 'Failed to schedule intro' },
        { status: 500 }
      )
    }

    // Notify both parties
    const yourName = isAgentAOwner ? match.agent_a.owner.name : match.agent_b.owner.name
    const otherUserId = isAgentAOwner ? match.agent_b.owner_id : match.agent_a.owner_id

    const methodLabels = {
      video_call: 'video call',
      in_person: 'in-person meeting',
      message: 'message',
      email: 'email',
    }

    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    await supabase.from('notifications').insert([
      {
        user_id: otherUserId,
        type: 'intro_scheduled',
        title: 'Intro Scheduled!',
        body: `${yourName} has scheduled a ${methodLabels[intro_method]} for ${formattedDate}`,
        data: {
          match_id: matchId,
          intro_method,
          scheduled_at,
        },
      },
      {
        user_id: user.id,
        type: 'intro_scheduled',
        title: 'Intro Confirmed',
        body: `Your ${methodLabels[intro_method]} is scheduled for ${formattedDate}`,
        data: {
          match_id: matchId,
          intro_method,
          scheduled_at,
        },
      },
    ])

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      message: `Intro scheduled for ${formattedDate}`,
    })

  } catch (error) {
    console.error('Error in POST /api/matches/[id]/schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
