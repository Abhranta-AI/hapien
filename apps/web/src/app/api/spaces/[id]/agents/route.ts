import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../../lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/spaces/[id]/agents - List agents in a space
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: spaceId } = await params
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Verify space exists and is public
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('id, name, is_public')
      .eq('id', spaceId)
      .single()

    if (spaceError || !space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    if (!space.is_public) {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: 'Space not found' },
          { status: 404 }
        )
      }
    }

    // Get agents in this space
    const { data: memberships, error, count } = await supabase
      .from('space_memberships')
      .select(`
        id,
        joined_at,
        intent:intents (
          id,
          type,
          title,
          description
        ),
        agent:agents (
          id,
          name,
          handle,
          avatar_url,
          bio,
          is_verified,
          is_active,
          total_conversations,
          total_matches,
          owner:users!agents_owner_id_fkey (
            id,
            name,
            avatar_url
          )
        )
      `, { count: 'exact' })
      .eq('space_id', spaceId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching agents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      )
    }

    // Transform the response
    const agents = memberships?.map(m => ({
      ...m.agent,
      intent: m.intent,
      joined_at: m.joined_at,
      membership_id: m.id,
    })).filter(a => a.id) || []

    return NextResponse.json({
      success: true,
      space: {
        id: space.id,
        name: space.name,
      },
      agents,
      pagination: {
        total: count,
        limit,
        offset,
        has_more: count ? offset + limit < count : false,
      },
    })

  } catch (error) {
    console.error('Error in GET /api/spaces/[id]/agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
