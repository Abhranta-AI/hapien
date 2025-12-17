'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Heart,
  Sparkles,
  PartyPopper,
  Send,
  MoreHorizontal,
  Trash2,
  Edit2,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Avatar, Card, Button } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PostWithRelations, Comment, User } from '@/types/database'
import { cn } from '@/utils/helpers'
import toast from 'react-hot-toast'

interface PostPageProps {
  params: Promise<{ id: string }>
}

const REACTION_TYPES = [
  { type: 'like', icon: Heart, label: 'Like', activeColor: 'text-tertiary-500' },
  { type: 'love', icon: Sparkles, label: 'Love', activeColor: 'text-secondary-500' },
  { type: 'celebrate', icon: PartyPopper, label: 'Celebrate', activeColor: 'text-category-sports' },
] as const

interface CommentWithUser extends Comment {
  user: User
}

export default function PostPage({ params }: PostPageProps) {
  const { id } = use(params)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [post, setPost] = useState<PostWithRelations | null>(null)
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [isReacting, setIsReacting] = useState(false)

  const fetchPost = useCallback(async () => {
    if (!id) return

    setIsLoading(true)

    try {
      // Fetch post with user info
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!user_id(*),
          community:communities!community_id(*),
          reactions(*)
        `)
        .eq('id', id)
        .single()

      if (postError) throw postError

      const post = postData as any

      setPost({
        ...post,
        user: post.user,
        community: post.community,
        reactions: post.reactions || [],
        comments: [],
        reactions_count: post.reactions?.length || 0,
        comments_count: 0,
      } as PostWithRelations)

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select(`
          *,
          user:users!user_id(*)
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true })

      setComments((commentsData || []) as CommentWithUser[])
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error('Post not found')
      router.push('/feed')
    } finally {
      setIsLoading(false)
    }
  }, [id, supabase, router])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const handleSubmitComment = async () => {
    if (!user || !post || !newComment.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const { error } = await (supabase
        .from('comments') as any)
        .insert({
          user_id: user.id,
          post_id: post.id,
          content: newComment.trim(),
        })

      if (error) throw error

      setNewComment('')
      fetchPost()
      toast.success('Comment added!')
    } catch (error) {
      console.error('Comment error:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    if (!confirm('Delete this comment?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      fetchPost()
      toast.success('Comment deleted')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete comment')
    }
  }

  const handleReaction = async (type: 'like' | 'love' | 'celebrate') => {
    if (!user || !post || isReacting) return

    setIsReacting(true)
    setShowReactions(false)

    const userReaction = post.reactions.find(r => r.user_id === user.id)

    try {
      if (userReaction?.type === type) {
        await supabase
          .from('reactions')
          .delete()
          .eq('id', userReaction.id)
      } else if (userReaction) {
        await (supabase
          .from('reactions') as any)
          .update({ type })
          .eq('id', userReaction.id)
      } else {
        await (supabase
          .from('reactions') as any)
          .insert({
            user_id: user.id,
            post_id: post.id,
            type,
          })
      }

      fetchPost()
    } catch (error) {
      console.error('Reaction error:', error)
    } finally {
      setIsReacting(false)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!user || !post) {
    return null
  }

  const userReaction = post.reactions.find(r => r.user_id === user.id)
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  return (
    <AppShell>
      {/* Custom Header */}
      <header className="sticky top-0 z-30 bg-dark-card/90 backdrop-blur-lg border-b border-dark-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-dark-elevated rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-xl font-semibold text-neutral-100">Post</h1>
          </div>
          {post && user?.id === post.user_id && (
            <Link
              href={`/post/${id}/edit`}
              className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-dark-elevated rounded-xl transition-colors"
            >
              <Edit2 className="w-5 h-5" />
            </Link>
          )}
        </div>
      </header>

      <main className="min-h-screen pt-0 pb-24 bg-dark-bg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Post Card */}
          <Card variant="elevated" padding="none" className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 pb-3">
              <Link href={`/profile/${post.user_id}`}>
                <Avatar
                  src={post.user.avatar_url}
                  name={post.user.name || 'User'}
                  size="md"
                />
              </Link>
              <div className="flex-1">
                <Link href={`/profile/${post.user_id}`}>
                  <p className="font-semibold text-neutral-100 hover:text-primary-400 transition-colors">
                    {post.user.name}
                  </p>
                </Link>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <span>{timeAgo}</span>
                  {post.community && (
                    <>
                      <span>•</span>
                      <Link
                        href={`/communities/${post.community_id}`}
                        className="hover:text-primary-400 transition-colors"
                      >
                        {post.community.name}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            {post.content && (
              <div className="px-4 pb-3">
                <p className="text-neutral-200 whitespace-pre-wrap text-lg">{post.content}</p>
              </div>
            )}

            {/* Media */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className={cn(
                'grid gap-1',
                post.media_urls.length === 1 && 'grid-cols-1',
                post.media_urls.length === 2 && 'grid-cols-2',
                post.media_urls.length >= 3 && 'grid-cols-2',
              )}>
                {post.media_urls.map((url, index) => (
                  <div
                    key={url}
                    className={cn(
                      'relative bg-dark-elevated',
                      post.media_urls!.length === 1 ? 'aspect-[4/3]' : 'aspect-square',
                    )}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Reactions summary */}
            {post.reactions.length > 0 && (
              <div className="px-4 py-3 flex items-center gap-2 text-sm text-neutral-500">
                <div className="flex -space-x-1">
                  {['like', 'love', 'celebrate'].map((type) => {
                    const count = post.reactions.filter(r => r.type === type).length
                    if (count === 0) return null
                    const config = REACTION_TYPES.find(r => r.type === type)
                    const Icon = config?.icon || Heart
                    return (
                      <div
                        key={type}
                        className={cn(
                          'w-6 h-6 rounded-full bg-dark-card flex items-center justify-center shadow-sm',
                          config?.activeColor
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    )
                  })}
                </div>
                <span>{post.reactions.length} reactions</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center border-t border-dark-border">
              <div className="relative flex-1">
                <button
                  onMouseEnter={() => setShowReactions(true)}
                  onMouseLeave={() => setShowReactions(false)}
                  onClick={() => handleReaction('like')}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                    userReaction
                      ? REACTION_TYPES.find(r => r.type === userReaction.type)?.activeColor
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-dark-bg'
                  )}
                >
                  {userReaction ? (
                    <>
                      {(() => {
                        const config = REACTION_TYPES.find(r => r.type === userReaction.type)
                        const Icon = config?.icon || Heart
                        return <Icon className="w-5 h-5" />
                      })()}
                      <span>{REACTION_TYPES.find(r => r.type === userReaction.type)?.label}</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5" />
                      <span>Like</span>
                    </>
                  )}
                </button>

                {showReactions && (
                  <div
                    onMouseEnter={() => setShowReactions(true)}
                    onMouseLeave={() => setShowReactions(false)}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-dark-card rounded-full shadow-soft-lg flex gap-1 z-10"
                  >
                    {REACTION_TYPES.map(({ type, icon: Icon, label, activeColor }) => (
                      <button
                        key={type}
                        onClick={() => handleReaction(type)}
                        className={cn(
                          'p-2 rounded-full hover:bg-dark-elevated transition-all hover:scale-125',
                          userReaction?.type === type && activeColor
                        )}
                        title={label}
                      >
                        <Icon className="w-6 h-6" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Comments Section */}
          <div className="mt-6">
            <h2 className="font-semibold text-neutral-100 mb-4">
              Comments ({comments.length})
            </h2>

            {/* Comment Input */}
            <div className="flex items-start gap-3 mb-6">
              <Avatar
                src={user.avatar_url}
                name={user.name || 'User'}
                size="sm"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-2.5 bg-dark-card rounded-xl border border-dark-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="!p-2.5"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <AnimatePresence>
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-start gap-3"
                  >
                    <Link href={`/profile/${comment.user_id}`}>
                      <Avatar
                        src={comment.user.avatar_url}
                        name={comment.user.name || 'User'}
                        size="sm"
                      />
                    </Link>
                    <div className="flex-1">
                      <div className="bg-dark-bg rounded-xl px-4 py-2.5">
                        <Link href={`/profile/${comment.user_id}`}>
                          <p className="font-semibold text-sm text-neutral-100 hover:text-primary-400 transition-colors">
                            {comment.user.name}
                          </p>
                        </Link>
                        <p className="text-neutral-300 mt-0.5">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 px-2">
                        <span className="text-xs text-neutral-400">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.user_id === user.id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-red-500 hover:text-tertiary-300 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {comments.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </main>

    </AppShell>
  )
}
