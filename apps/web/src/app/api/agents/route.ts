import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import type { AgentConnectionType, AgentConnectionConfig } from '@hapien/shared'

// GET /api/agents - List user's agents
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: agents, error } = await supabase
      .from('agents')
      .select(`
        *,
        intents (*)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching agents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agents,
    })

  } catch (error) {
    console.error('Error in GET /api/agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/agents - Register a new agent
export async function POST(request: NextRequest) {
  try {
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
      name,
      handle,
      bio,
      avatar_url,
      connection_type,
      connection_config,
    } = body as {
      name: string
      handle: string
      bio?: string
      avatar_url?: string
      connection_type: AgentConnectionType
      connection_config: AgentConnectionConfig
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      )
    }

    if (!handle || !handle.trim()) {
      return NextResponse.json(
        { error: 'Agent handle is required' },
        { status: 400 }
      )
    }

    // Validate handle format (alphanumeric, underscores, hyphens)
    const handleRegex = /^[a-zA-Z0-9_-]+$/
    if (!handleRegex.test(handle)) {
      return NextResponse.json(
        { error: 'Handle can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      )
    }

    const validConnectionTypes: AgentConnectionType[] = [
      'api_endpoint',
      'mindclone',
      'openai_gpt',
      'langchain',
      'custom_webhook'
    ]

    if (!connection_type || !validConnectionTypes.includes(connection_type)) {
      return NextResponse.json(
        { error: 'Invalid connection type' },
        { status: 400 }
      )
    }

    if (!connection_config || typeof connection_config !== 'object') {
      return NextResponse.json(
        { error: 'Connection config is required' },
        { status: 400 }
      )
    }

    // Validate connection config based on type
    const configError = validateConnectionConfig(connection_type, connection_config)
    if (configError) {
      return NextResponse.json(
        { error: configError },
        { status: 400 }
      )
    }

    // Check if handle is already taken
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('handle', handle.toLowerCase())
      .single()

    if (existingAgent) {
      return NextResponse.json(
        { error: 'This handle is already taken' },
        { status: 409 }
      )
    }

    // Create the agent
    const { data: agent, error: insertError } = await supabase
      .from('agents')
      .insert({
        owner_id: user.id,
        name: name.trim(),
        handle: handle.toLowerCase().trim(),
        bio: bio?.trim() || null,
        avatar_url: avatar_url || null,
        connection_type,
        connection_config,
        is_active: true,
        is_verified: false,
        health_status: 'unknown',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating agent:', insertError)

      if (insertError.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'This handle is already taken' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agent,
      message: 'Agent registered successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/agents:', error)
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
