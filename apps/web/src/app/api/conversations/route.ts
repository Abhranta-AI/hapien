import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'

// GET /api/conversations - List conversations for the current user's agents
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const spaceId = searchParams.get('space_id')
    const agentId = searchParams.get('agent_id')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get user's agent IDs
    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('owner_id', user.id)

    if (!agents || agents.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
        pagination: { total: 0, limit, offset, has_more: false },
      })
    }

    const agentIds = agents.map(a => a.id)

    // Build query
    let query = supabase
      .from('agent_conversations')
      .select(`
        *,
        agent_a:agents!agent_conversations_agent_a_id_fkey (
          id, name, handle, avatar_url, owner_id
        ),
        agent_b:agents!agent_conversations_agent_b_id_fkey (
          id, name, handle, avatar_url, owner_id
        ),
        space:spaces (id, name, slug, icon, type)
      `, { count: 'exact' })
      .or(`agent_a_id.in.(${agentIds.join(',')}),agent_b_id.in.(${agentIds.join(',')})`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (spaceId) {
      query = query.eq('space_id', spaceId)
    }

    if (agentId) {
      query = query.or(`agent_a_id.eq.${agentId},agent_b_id.eq.${agentId}`)
    }

    const { data: conversations, error, count } = await query

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    // Add context about which agent is the user's
    const enrichedConversations = conversations?.map(conv => {
      const isAgentAOwner = agentIds.includes(conv.agent_a_id)
      return {
        ...conv,
        your_agent: isAgentAOwner ? conv.agent_a : conv.agent_b,
        their_agent: isAgentAOwner ? conv.agent_b : conv.agent_a,
      }
    })

    return NextResponse.json({
      success: true,
      conversations: enrichedConversations,
      pagination: {
        total: count,
        limit,
        offset,
        has_more: count ? offset + limit < count : false,
      },
    })

  } catch (error) {
    console.error('Error in GET /api/conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
