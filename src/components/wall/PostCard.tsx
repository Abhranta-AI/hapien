'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Flag } from 'lucide-react'
import { WallPostWithRelations, User } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface PostCardProps {
  post: WallPostWithRelations
  currentUser: User
  onReact: (postId: string, type: 'like' | 'love' | 'celebrate') => void
  onComment: (postId: string, content: string) => void
  onDelete?: (postId: string) => void
}

export function PostCard({ post, currentUser, onReact, onComment, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [isLiked, setIsLiked] = useState(!!post.user_reaction)

  const isOwnPost = post.user_id === currentUser.id

  const handleReact = () => {
    setIsLiked(!isLiked)
    onReact(post.id, 'like')
  }

  const handleComment = () => {
    if (!commentText.trim()) return
    onComment(post.id, commentText)
    setCommentText('')
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-dark"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-0">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {post.user.avatar_url ? (
            <img
              src={post.user.avatar_url}
              alt={post.user.name || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-coral-500/20 flex items-center justify-center">
              <span className="text-sm font-bold text-coral-500">
                {(post.user.name || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}

          {/* Name and time */}
          <div>
            <h4 className="font-semibold text-text-primary">{post.user.name || 'Anonymous'}</h4>
            <p className="text-xs text-text-muted">{timeAgo}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-dark-surface rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-48 card-dark-elevated rounded-xl overflow-hidden z-10"
              >
                {isOwnPost && onDelete && (
                  <button
                    onClick={() => {
                      onDelete(post.id)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-urgent-500 hover:bg-dark-surface transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete post
                  </button>
                )}
                {!isOwnPost && (
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-dark-surface transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 py-3 text-text-primary whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`grid gap-1 ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.media_urls.map((url, index) => (
            <div
              key={index}
              className={`relative ${
                post.media_urls!.length === 1 ? 'aspect-video' : 'aspect-square'
              }`}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 px-4 py-2 text-sm text-text-muted">
        {post.reactions_count > 0 && (
          <span>{post.reactions_count} {post.reactions_count === 1 ? 'like' : 'likes'}</span>
        )}
        {post.comments_count > 0 && (
          <span>{post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-dark-border">
        <button
          onClick={handleReact}
          className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${
            isLiked
              ? 'text-urgent-500'
              : 'text-text-muted hover:text-urgent-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">Like</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-text-muted hover:text-coral-500 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Comment</span>
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-text-muted hover:text-jade-500 transition-colors">
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-dark-border"
          >
            {/* Existing comments */}
            {post.comments.length > 0 && (
              <div className="px-4 py-3 space-y-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    {comment.user.avatar_url ? (
                      <img
                        src={comment.user.avatar_url}
                        alt={comment.user.name || 'User'}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-coral-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-coral-500">
                          {(comment.user.name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 bg-dark-surface rounded-xl px-3 py-2">
                      <span className="font-semibold text-sm text-text-primary">
                        {comment.user.name || 'Anonymous'}
                      </span>
                      <p className="text-sm text-text-secondary">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input */}
            <div className="flex items-center gap-2 p-4 pt-0">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name || 'You'}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-coral-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-coral-500">
                    {(currentUser.name || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 flex items-center gap-2 bg-dark-surface rounded-full px-4 py-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Write a comment..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="text-coral-500 disabled:text-text-muted disabled:cursor-not-allowed"
                >
                  <span className="text-sm font-semibold">Post</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
