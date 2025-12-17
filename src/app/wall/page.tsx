'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Wall } from '@/components/wall'
import { WallPostWithRelations, WallPostVisibility } from '@/types/database'
import { BottomNav } from '@/components/layout'
import toast from 'react-hot-toast'
import {
  createPost,
  getWallFeed,
  reactToPost,
  commentOnPost,
  deletePost,
  getConnectionsCount
} from '@/app/actions/wall'

export default function WallPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<WallPostWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionsCount, setConnectionsCount] = useState(0)

  // Fetch wall feed
  const fetchFeed = useCallback(async () => {
    try {
      setIsLoading(true)
      const [feedPosts, count] = await Promise.all([
        getWallFeed(),
        getConnectionsCount()
      ])
      setPosts(feedPosts)
      setConnectionsCount(count)
    } catch (error) {
      console.error('Failed to fetch wall feed:', error)
      toast.error('Failed to load feed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Fetch feed on mount
  useEffect(() => {
    if (user) {
      fetchFeed()
    }
  }, [user, fetchFeed])

  const handleCreatePost = async (content: string, mediaUrls: string[], visibility: WallPostVisibility) => {
    if (!user) return

    // Create optimistic post
    const optimisticPost: WallPostWithRelations = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      content,
      media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      visibility,
      community_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: user,
      reactions: [],
      comments: [],
      reactions_count: 0,
      comments_count: 0,
      user_reaction: null
    }

    setPosts(prev => [optimisticPost, ...prev])

    try {
      await createPost(content, mediaUrls.length > 0 ? mediaUrls : null, visibility)
      toast.success('Posted to your wall!')
      // Refresh to get the real post with proper ID
      fetchFeed()
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('Failed to create post')
      // Remove optimistic post on failure
      setPosts(prev => prev.filter(p => p.id !== optimisticPost.id))
    }
  }

  const handleReact = async (postId: string, type: 'like' | 'love' | 'celebrate') => {
    if (!user) return

    // Optimistic update
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          const wasLiked = !!post.user_reaction
          return {
            ...post,
            reactions_count: wasLiked ? post.reactions_count - 1 : post.reactions_count + 1,
            user_reaction: wasLiked ? null : { id: '', user_id: user.id, post_id: postId, type, created_at: '' }
          }
        }
        return post
      })
    )

    try {
      await reactToPost(postId, type)
    } catch (error) {
      console.error('Failed to react to post:', error)
      // Revert on failure
      fetchFeed()
    }
  }

  const handleComment = async (postId: string, content: string) => {
    if (!user) return

    // Optimistic update
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments_count: post.comments_count + 1,
            comments: [
              ...post.comments,
              {
                id: `temp-${Date.now()}`,
                user_id: user.id,
                post_id: postId,
                hangout_id: null,
                content,
                created_at: new Date().toISOString(),
                user: user
              }
            ]
          }
        }
        return post
      })
    )

    try {
      await commentOnPost(postId, content)
      toast.success('Comment added!')
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Failed to add comment')
      // Revert on failure
      fetchFeed()
    }
  }

  const handleDeletePost = async (postId: string) => {
    // Optimistic update
    const deletedPost = posts.find(p => p.id === postId)
    setPosts(prev => prev.filter(post => post.id !== postId))

    try {
      await deletePost(postId)
      toast.success('Post deleted')
    } catch (error) {
      console.error('Failed to delete post:', error)
      toast.error('Failed to delete post')
      // Revert on failure
      if (deletedPost) {
        setPosts(prev => [deletedPost, ...prev])
      }
    }
  }

  const handleRefresh = async () => {
    await fetchFeed()
    toast.success('Feed refreshed!')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-coral-500 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-dark-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-bg/80 backdrop-blur-lg border-b border-dark-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Your Wall</h1>
              <p className="text-sm text-text-muted flex items-center gap-1">
                <Users className="w-4 h-4" />
                {connectionsCount} connections
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-4">
        <Wall
          currentUser={user}
          posts={posts}
          onCreatePost={handleCreatePost}
          onReact={handleReact}
          onComment={handleComment}
          onDeletePost={handleDeletePost}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      </main>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  )
}
