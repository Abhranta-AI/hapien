import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../../lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/spaces/[id]/join - Join an agent to a space
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: spaceId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { agent_id, intent_id } = body as {
      agent_id: string
      intent_id?: string
    }

    if (!agent_id) {
      return NextResponse.json(
        { error: 'agent_id is required' },
        { status: 400 }
      )
    }

    // Verify space exists and is public
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('id, name, is_public, settings')
      .eq('id', spaceId)
      .single()

    if (spaceError || !space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    if (!space.is_public) {
      return NextResponse.json(
        { error: 'This space is not accepting new members' },
        { status: 403 }
      )
    }

    // Verify agent exists and user owns it
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, owner_id, name, is_active')
      .eq('id', agent_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    if (agent.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to join this agent to spaces' },
        { status: 403 }
      )
    }

    if (!agent.is_active) {
      return NextResponse.json(
        { error: 'Agent must be active to join spaces' },
        { status: 400 }
      )
    }

    // Verify intent if provided
    if (intent_id) {
      const { data: intent, error: intentError } = await supabase
        .from('intents')
        .select('id, agent_id')
        .eq('id', intent_id)
        .eq('agent_id', agent_id)
        .single()

      if (intentError || !intent) {
        return NextResponse.json(
          { error: 'Intent not found or does not belong to this agent' },
          { status: 400 }
        )
      }
    }

    // Check if agent is already in this space
    const { data: existingMembership } = await supabase
      .from('space_memberships')
      .select('id, is_active')
      .eq('space_id', spaceId)
      .eq('agent_id', agent_id)
      .single()

    if (existingMembership) {
      if (existingMembership.is_active) {
        return NextResponse.json(
          { error: 'Agent is already a member of this space' },
          { status: 409 }
        )
      }

      // Reactivate membership
      const { data: membership, error: updateError } = await supabase
        .from('space_memberships')
        .update({
          is_active: true,
          intent_id: intent_id || null,
          joined_at: new Date().toISOString(),
        })
        .eq('id', existingMembership.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error reactivating membership:', updateError)
        return NextResponse.json(
          { error: 'Failed to join space' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        membership,
        message: `Agent "${agent.name}" rejoined space "${space.name}"`,
      })
    }

    // Check space limits if any
    const settings = space.settings as { max_agents?: number } | null
    if (settings?.max_agents) {
      const { count } = await supabase
        .from('space_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('space_id', spaceId)
        .eq('is_active', true)

      if (count && count >= settings.max_agents) {
        return NextResponse.json(
          { error: 'This space has reached its maximum capacity' },
          { status: 403 }
        )
      }
    }

    // Create membership
    const { data: membership, error: insertError } = await supabase
      .from('space_memberships')
      .insert({
        space_id: spaceId,
        agent_id: agent_id,
        intent_id: intent_id || null,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating membership:', insertError)

      if (insertError.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Agent is already a member of this space' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to join space' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      membership,
      message: `Agent "${agent.name}" joined space "${space.name}"`,
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/spaces/[id]/join:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/spaces/[id]/join - Leave a space (remove agent from space)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: spaceId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')

    if (!agentId) {
      return NextResponse.json(
        { error: 'agent_id query parameter is required' },
        { status: 400 }
      )
    }

    // Verify agent exists and user owns it
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, owner_id, name')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    if (agent.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this agent from spaces' },
        { status: 403 }
      )
    }

    // Find and deactivate membership
    const { data: membership, error: fetchError } = await supabase
      .from('space_memberships')
      .select('id')
      .eq('space_id', spaceId)
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single()

    if (fetchError || !membership) {
      return NextResponse.json(
        { error: 'Agent is not a member of this space' },
        { status: 404 }
      )
    }

    // Soft delete by setting is_active to false
    const { error: updateError } = await supabase
      .from('space_memberships')
      .update({ is_active: false })
      .eq('id', membership.id)

    if (updateError) {
      console.error('Error leaving space:', updateError)
      return NextResponse.json(
        { error: 'Failed to leave space' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Agent "${agent.name}" left the space`,
    })

  } catch (error) {
    console.error('Error in DELETE /api/spaces/[id]/join:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
