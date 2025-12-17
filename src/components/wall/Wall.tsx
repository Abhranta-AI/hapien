'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { User, WallPostWithRelations, WallPostVisibility } from '@/types/database'
import { CreatePost } from './CreatePost'
import { PostCard } from './PostCard'

interface WallProps {
  currentUser: User
  posts: WallPostWithRelations[]
  onCreatePost: (content: string, mediaUrls: string[], visibility: WallPostVisibility) => Promise<void>
  onReact: (postId: string, type: 'like' | 'love' | 'celebrate') => void
  onComment: (postId: string, content: string) => void
  onDeletePost?: (postId: string) => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function Wall({
  currentUser,
  posts,
  onCreatePost,
  onReact,
  onComment,
  onDeletePost,
  onRefresh,
  isLoading = false
}: WallProps) {
  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Create post */}
      <CreatePost user={currentUser} onPost={onCreatePost} />

      {/* Refresh button */}
      {onRefresh && (
        <div className="flex justify-center">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh feed'}
          </button>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PostCard
                post={post}
                currentUser={currentUser}
                onReact={onReact}
                onComment={onComment}
                onDelete={onDeletePost}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card-dark p-8 text-center"
    >
      <div className="text-5xl mb-4">📝</div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        No posts yet
      </h3>
      <p className="text-text-secondary">
        Share your first moment with your tribe! Your connections will see it in their feed.
      </p>
    </motion.div>
  )
}
