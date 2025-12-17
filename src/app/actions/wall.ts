'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { WallPostVisibility, WallPostWithRelations, PostVisibility } from '@/types/database'

// Map UI visibility values to database visibility values
function mapVisibilityToDb(visibility: WallPostVisibility): PostVisibility {
  switch (visibility) {
    case 'connections':
      return 'friends'
    case 'close_friends':
      return 'friends'
    case 'community':
      return 'community_only'
    default:
      return 'friends'
  }
}

// Map database visibility values to UI visibility values
function mapVisibilityToUi(visibility: PostVisibility): WallPostVisibility {
  switch (visibility) {
    case 'friends':
      return 'connections'
    case 'friends_communities':
      return 'connections'
    case 'community_only':
      return 'community'
    default:
      return 'connections'
  }
}

// Create a new wall post
export async function createPost(
  content: string,
  mediaUrls: string[] | null,
  visibility: WallPostVisibility
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const dbVisibility = mapVisibilityToDb(visibility)

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content,
      media_urls: mediaUrls,
      visibility: dbVisibility,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/wall')
  return data
}

// Get wall feed (posts from connections)
export async function getWallFeed(): Promise<WallPostWithRelations[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get user's friend IDs from friendships table
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted')

  const friendIds = new Set<string>()
  friendIds.add(user.id) // Include own posts

  friendships?.forEach(friendship => {
    if (friendship.requester_id === user.id) {
      friendIds.add(friendship.addressee_id)
    } else {
      friendIds.add(friendship.requester_id)
    }
  })

  // Get posts from friends
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(*),
      reactions(*),
      comments(*, user:users(*))
    `)
    .in('user_id', Array.from(friendIds))
    .in('visibility', ['friends', 'friends_communities'])
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  // Get current user's reactions
  const postIds = posts?.map(p => p.id) || []
  const { data: userReactions } = await supabase
    .from('reactions')
    .select('*')
    .eq('user_id', user.id)
    .in('post_id', postIds)

  const userReactionsMap = new Map(userReactions?.map(r => [r.post_id, r]))

  // Transform posts with counts, user reaction, and map visibility to UI values
  return posts?.map(post => ({
    ...post,
    visibility: mapVisibilityToUi(post.visibility),
    reactions_count: post.reactions?.length || 0,
    comments_count: post.comments?.length || 0,
    user_reaction: userReactionsMap.get(post.id) || null
  })) || []
}

// React to a post
export async function reactToPost(postId: string, type: 'like' | 'love' | 'celebrate') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if user already reacted
  const { data: existing } = await supabase
    .from('reactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()

  if (existing) {
    // Remove reaction (toggle off)
    await supabase
      .from('reactions')
      .delete()
      .eq('id', existing.id)
  } else {
    // Add reaction
    await supabase
      .from('reactions')
      .insert({
        user_id: user.id,
        post_id: postId,
        type
      })
  }

  revalidatePath('/wall')
  return { success: true, action: existing ? 'removed' : 'added' }
}

// Comment on a post
export async function commentOnPost(postId: string, content: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      post_id: postId,
      content
    })
    .select(`*, user:users(*)`)
    .single()

  if (error) throw error

  revalidatePath('/wall')
  return data
}

// Delete a post
export async function deletePost(postId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify ownership
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (!post || post.user_id !== user.id) {
    throw new Error('Not authorized to delete this post')
  }

  // Delete reactions and comments first (cascade should handle this but being explicit)
  await supabase.from('reactions').delete().eq('post_id', postId)
  await supabase.from('comments').delete().eq('post_id', postId)

  // Delete post
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) throw error

  revalidatePath('/wall')
  return { success: true }
}

// Get a single post with details
export async function getPost(postId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(*),
      reactions(*),
      comments(*, user:users(*))
    `)
    .eq('id', postId)
    .single()

  if (error) throw error

  // Get user's reaction
  const { data: userReaction } = await supabase
    .from('reactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()

  return {
    ...post,
    reactions_count: post.reactions?.length || 0,
    comments_count: post.comments?.length || 0,
    user_reaction: userReaction || null
  }
}

// Get count of connections (accepted friendships) for current user
export async function getConnectionsCount(): Promise<number> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted')

  if (error) return 0

  return count || 0
}
