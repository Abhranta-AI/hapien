import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../lib/supabase/server'
import type { AgentConnectionType, AgentConnectionConfig } from '@hapien/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/agents/[id] - Get agent details
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

    const { data: agent, error } = await supabase
      .from('agents')
      .select(`
        *,
        intents (*),
        owner:users!agents_owner_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single()

    if (error || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Check if user owns this agent (for full details) or just viewing
    const isOwner = agent.owner_id === user.id

    // If not owner, only return public info
    if (!isOwner) {
      const publicAgent = {
        id: agent.id,
        name: agent.name,
        handle: agent.handle,
        avatar_url: agent.avatar_url,
        bio: agent.bio,
        is_active: agent.is_active,
        is_verified: agent.is_verified,
        total_conversations: agent.total_conversations,
        total_matches: agent.total_matches,
        created_at: agent.created_at,
        owner: agent.owner,
        intents: agent.intents?.filter((i: { is_active: boolean }) => i.is_active),
      }

      return NextResponse.json({
        success: true,
        agent: publicAgent,
        is_owner: false,
      })
    }

    return NextResponse.json({
      success: true,
      agent,
      is_owner: true,
    })

  } catch (error) {
    console.error('Error in GET /api/agents/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/agents/[id] - Update agent
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Verify ownership
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('id, owner_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    if (existingAgent.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this agent' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const allowedFields = [
      'name',
      'bio',
      'avatar_url',
      'connection_type',
      'connection_config',
      'is_active',
    ]

    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    // Validate name if provided
    if (updates.name !== undefined) {
      if (!updates.name || !(updates.name as string).trim()) {
        return NextResponse.json(
          { error: 'Agent name cannot be empty' },
          { status: 400 }
        )
      }
      updates.name = (updates.name as string).trim()
    }

    // Validate connection config if connection type is being updated
    if (updates.connection_type || updates.connection_config) {
      const connectionType = (updates.connection_type || body.connection_type) as AgentConnectionType
      const connectionConfig = (updates.connection_config || body.connection_config) as AgentConnectionConfig

      if (connectionType && connectionConfig) {
        const configError = validateConnectionConfig(connectionType, connectionConfig)
        if (configError) {
          return NextResponse.json(
            { error: configError },
            { status: 400 }
          )
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: agent, error: updateError } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating agent:', updateError)
      return NextResponse.json(
        { error: 'Failed to update agent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agent,
      message: 'Agent updated successfully',
    })

  } catch (error) {
    console.error('Error in PATCH /api/agents/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/agents/[id] - Delete agent
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verify ownership
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('id, owner_id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    if (existingAgent.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this agent' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting agent:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete agent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Agent "${existingAgent.name}" deleted successfully`,
    })

  } catch (error) {
    console.error('Error in DELETE /api/agents/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to validate connection config
function validateConnectionConfig(
  type: AgentConnectionType,
  config: AgentConnectionConfig
): string | null {
  switch (type) {
    case 'api_endpoint': {
      const c = config as { endpoint?: string }
      if (!c.endpoint || !isValidUrl(c.endpoint)) {
        return 'Valid endpoint URL is required for api_endpoint type'
      }
      break
    }

    case 'mindclone': {
      const c = config as { handle?: string }
      if (!c.handle || !c.handle.trim()) {
        return 'Mindclone handle is required'
      }
      break
    }

    case 'openai_gpt': {
      const c = config as { gpt_id?: string }
      if (!c.gpt_id || !c.gpt_id.trim()) {
        return 'GPT ID is required for openai_gpt type'
      }
      break
    }

    case 'langchain': {
      const c = config as { endpoint?: string }
      if (!c.endpoint || !isValidUrl(c.endpoint)) {
        return 'Valid endpoint URL is required for langchain type'
      }
      break
    }

    case 'custom_webhook': {
      const c = config as { webhook_url?: string }
      if (!c.webhook_url || !isValidUrl(c.webhook_url)) {
        return 'Valid webhook URL is required for custom_webhook type'
      }
      break
    }
  }

  return null
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}
