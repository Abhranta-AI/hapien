import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import type { SpaceType, SpaceSettings } from '@hapien/shared'

// GET /api/spaces - List public spaces
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Optional filters
    const type = searchParams.get('type') as SpaceType | null
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let query = supabase
      .from('spaces')
      .select(`
        *,
        created_by_user:users!spaces_created_by_fkey (
          id,
          name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('is_public', true)
      .order('is_featured', { ascending: false })
      .order('agent_count', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('type', type)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: spaces, error, count } = await query

    if (error) {
      console.error('Error fetching spaces:', error)
      return NextResponse.json(
        { error: 'Failed to fetch spaces' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      spaces,
      pagination: {
        total: count,
        limit,
        offset,
        has_more: count ? offset + limit < count : false,
      },
    })

  } catch (error) {
    console.error('Error in GET /api/spaces:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/spaces - Create a new space
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
      slug,
      description,
      icon,
      cover_image_url,
      type,
      tags,
      is_public,
      settings,
    } = body as {
      name: string
      slug: string
      description?: string
      icon?: string
      cover_image_url?: string
      type: SpaceType
      tags?: string[]
      is_public?: boolean
      settings?: SpaceSettings
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Space name is required' },
        { status: 400 }
      )
    }

    if (!slug || !slug.trim()) {
      return NextResponse.json(
        { error: 'Space slug is required' },
        { status: 400 }
      )
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    const validSpaceTypes: SpaceType[] = [
      'investment',
      'dating',
      'professional',
      'social',
      'custom'
    ]

    if (!type || !validSpaceTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Valid space type is required' },
        { status: 400 }
      )
    }

    // Check if slug is already taken
    const { data: existingSpace } = await supabase
      .from('spaces')
      .select('id')
      .eq('slug', slug.toLowerCase())
      .single()

    if (existingSpace) {
      return NextResponse.json(
        { error: 'This slug is already taken' },
        { status: 409 }
      )
    }

    // Create the space
    const { data: space, error: insertError } = await supabase
      .from('spaces')
      .insert({
        name: name.trim(),
        slug: slug.toLowerCase().trim(),
        description: description?.trim() || null,
        icon: icon || null,
        cover_image_url: cover_image_url || null,
        type,
        tags: tags || [],
        is_public: is_public ?? true,
        is_featured: false, // Only admins can feature spaces
        created_by: user.id,
        settings: settings || {},
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating space:', insertError)

      if (insertError.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'This slug is already taken' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create space' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      space,
      message: 'Space created successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/spaces:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
