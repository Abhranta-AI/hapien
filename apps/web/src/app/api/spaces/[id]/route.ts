import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/spaces/[id] - Get space details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Try to find by ID first, then by slug
    let query = supabase
      .from('spaces')
      .select(`
        *,
        created_by_user:users!spaces_created_by_fkey (
          id,
          name,
          avatar_url
        )
      `)

    // Check if id is a UUID or a slug
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(id)) {
      query = query.eq('id', id)
    } else {
      query = query.eq('slug', id)
    }

    const { data: space, error } = await query.single()

    if (error || !space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    // Check if space is public
    if (!space.is_public) {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || space.created_by !== user.id) {
        return NextResponse.json(
          { error: 'Space not found' },
          { status: 404 }
        )
      }
    }

    // Get some agents in this space (preview)
    const { data: memberships } = await supabase
      .from('space_memberships')
      .select(`
        agent:agents (
          id,
          name,
          handle,
          avatar_url,
          is_verified
        )
      `)
      .eq('space_id', space.id)
      .eq('is_active', true)
      .limit(10)

    const agents_preview = memberships?.map(m => m.agent).filter(Boolean) || []

    return NextResponse.json({
      success: true,
      space: {
        ...space,
        agents_preview,
      },
    })

  } catch (error) {
    console.error('Error in GET /api/spaces/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/spaces/[id] - Update space (creator only)
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

    // Fetch space
    const { data: existingSpace, error: fetchError } = await supabase
      .from('spaces')
      .select('id, created_by')
      .eq('id', id)
      .single()

    if (fetchError || !existingSpace) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    if (existingSpace.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this space' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const allowedFields = [
      'name',
      'description',
      'icon',
      'cover_image_url',
      'tags',
      'is_public',
      'settings',
    ]

    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (updates.name !== undefined) {
      if (!updates.name || !(updates.name as string).trim()) {
        return NextResponse.json(
          { error: 'Space name cannot be empty' },
          { status: 400 }
        )
      }
      updates.name = (updates.name as string).trim()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: space, error: updateError } = await supabase
      .from('spaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating space:', updateError)
      return NextResponse.json(
        { error: 'Failed to update space' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      space,
      message: 'Space updated successfully',
    })

  } catch (error) {
    console.error('Error in PATCH /api/spaces/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/spaces/[id] - Delete space (creator only)
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

    // Fetch space
    const { data: existingSpace, error: fetchError } = await supabase
      .from('spaces')
      .select('id, created_by, name, is_featured')
      .eq('id', id)
      .single()

    if (fetchError || !existingSpace) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    if (existingSpace.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this space' },
        { status: 403 }
      )
    }

    // Don't allow deleting featured spaces
    if (existingSpace.is_featured) {
      return NextResponse.json(
        { error: 'Featured spaces cannot be deleted' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('spaces')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting space:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete space' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Space "${existingSpace.name}" deleted successfully`,
    })

  } catch (error) {
    console.error('Error in DELETE /api/spaces/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
