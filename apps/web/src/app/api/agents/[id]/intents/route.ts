import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../../lib/supabase/server'
import type { IntentType, IntentPreferences } from '@hapien/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/agents/[id]/intents - List agent's intents
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: agentId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify agent exists and user owns it
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, owner_id')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // If not owner, only show active intents
    const isOwner = agent.owner_id === user.id

    let query = supabase
      .from('intents')
      .select('*')
      .eq('agent_id', agentId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (!isOwner) {
      query = query.eq('is_active', true)
    }

    const { data: intents, error } = await query

    if (error) {
      console.error('Error fetching intents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch intents' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      intents,
      is_owner: isOwner,
    })

  } catch (error) {
    console.error('Error in GET /api/agents/[id]/intents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/agents/[id]/intents - Create a new intent
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: agentId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify agent exists and user owns it
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, owner_id')
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
        { error: 'You do not have permission to add intents to this agent' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      type,
      title,
      description,
      preferences,
      priority,
    } = body as {
      type: IntentType
      title: string
      description?: string
      preferences?: IntentPreferences
      priority?: number
    }

    // Validate required fields
    const validIntentTypes: IntentType[] = [
      'investment',
      'dating',
      'cofounder',
      'collaboration',
      'friendship',
      'hiring',
      'mentorship',
      'custom'
    ]

    if (!type || !validIntentTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Valid intent type is required' },
        { status: 400 }
      )
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Intent title is required' },
        { status: 400 }
      )
    }

    // Create the intent
    const { data: intent, error: insertError } = await supabase
      .from('intents')
      .insert({
        agent_id: agentId,
        type,
        title: title.trim(),
        description: description?.trim() || null,
        preferences: preferences || {},
        priority: priority ?? 1,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating intent:', insertError)
      return NextResponse.json(
        { error: 'Failed to create intent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      intent,
      message: 'Intent created successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/agents/[id]/intents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/agents/[id]/intents - Update an intent (intent_id in body)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: agentId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { intent_id, ...updates } = body

    if (!intent_id) {
      return NextResponse.json(
        { error: 'intent_id is required' },
        { status: 400 }
      )
    }

    // Verify agent exists and user owns it
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, owner_id')
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
        { error: 'You do not have permission to update this intent' },
        { status: 403 }
      )
    }

    // Verify intent belongs to this agent
    const { data: existingIntent, error: intentError } = await supabase
      .from('intents')
      .select('id, agent_id')
      .eq('id', intent_id)
      .eq('agent_id', agentId)
      .single()

    if (intentError || !existingIntent) {
      return NextResponse.json(
        { error: 'Intent not found' },
        { status: 404 }
      )
    }

    // Filter allowed fields
    const allowedFields = ['type', 'title', 'description', 'preferences', 'priority', 'is_active']
    const filteredUpdates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in updates) {
        filteredUpdates[field] = updates[field]
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Validate title if being updated
    if (filteredUpdates.title !== undefined) {
      if (!filteredUpdates.title || !(filteredUpdates.title as string).trim()) {
        return NextResponse.json(
          { error: 'Intent title cannot be empty' },
          { status: 400 }
        )
      }
      filteredUpdates.title = (filteredUpdates.title as string).trim()
    }

    const { data: intent, error: updateError } = await supabase
      .from('intents')
      .update(filteredUpdates)
      .eq('id', intent_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating intent:', updateError)
      return NextResponse.json(
        { error: 'Failed to update intent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      intent,
      message: 'Intent updated successfully',
    })

  } catch (error) {
    console.error('Error in PATCH /api/agents/[id]/intents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/agents/[id]/intents - Delete an intent (intent_id in query params)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: agentId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const intentId = searchParams.get('intent_id')

    if (!intentId) {
      return NextResponse.json(
        { error: 'intent_id query parameter is required' },
        { status: 400 }
      )
    }

    // Verify agent exists and user owns it
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, owner_id')
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
        { error: 'You do not have permission to delete this intent' },
        { status: 403 }
      )
    }

    // Verify intent belongs to this agent
    const { data: existingIntent, error: intentError } = await supabase
      .from('intents')
      .select('id, agent_id, title')
      .eq('id', intentId)
      .eq('agent_id', agentId)
      .single()

    if (intentError || !existingIntent) {
      return NextResponse.json(
        { error: 'Intent not found' },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase
      .from('intents')
      .delete()
      .eq('id', intentId)

    if (deleteError) {
      console.error('Error deleting intent:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete intent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Intent "${existingIntent.title}" deleted successfully`,
    })

  } catch (error) {
    console.error('Error in DELETE /api/agents/[id]/intents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
