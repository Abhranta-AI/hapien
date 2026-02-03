import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'

// GET /api/matches - List matches for the current user
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
        matches: [],
        pagination: { total: 0, limit, offset, has_more: false },
      })
    }

    const agentIds = agents.map(a => a.id)

    // Build query for matches involving user's agents
    let query = supabase
      .from('matches')
      .select(`
        *,
        agent_a:agents!matches_agent_a_id_fkey (
          id, name, handle, avatar_url, bio, is_verified,
          owner:users!agents_owner_id_fkey (id, name, avatar_url)
        ),
        agent_b:agents!matches_agent_b_id_fkey (
          id, name, handle, avatar_url, bio, is_verified,
          owner:users!agents_owner_id_fkey (id, name, avatar_url)
        ),
        space:spaces (id, name, slug, icon, type),
        conversation:agent_conversations (id, turn_count, started_at)
      `, { count: 'exact' })
      .or(`agent_a_id.in.(${agentIds.join(',')}),agent_b_id.in.(${agentIds.join(',')})`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: matches, error, count } = await query

    if (error) {
      console.error('Error fetching matches:', error)
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      )
    }

    // Add context about which side the user is on
    const enrichedMatches = matches?.map(match => {
      const isAgentAOwner = match.agent_a.owner.id === user.id
      return {
        ...match,
        your_agent: isAgentAOwner ? match.agent_a : match.agent_b,
        their_agent: isAgentAOwner ? match.agent_b : match.agent_a,
        your_approval: isAgentAOwner ? match.agent_a_owner_approved : match.agent_b_owner_approved,
        their_approval: isAgentAOwner ? match.agent_b_owner_approved : match.agent_a_owner_approved,
        needs_your_action: isAgentAOwner
          ? !match.agent_a_owner_approved && match.status === 'pending'
          : !match.agent_b_owner_approved && match.status === 'pending',
      }
    })

    return NextResponse.json({
      success: true,
      matches: enrichedMatches,
      pagination: {
        total: count,
        limit,
        offset,
        has_more: count ? offset + limit < count : false,
      },
    })

  } catch (error) {
    console.error('Error in GET /api/matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
