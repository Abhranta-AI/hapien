'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, X, Send, Globe, Users, Heart, ChevronDown } from 'lucide-react'
import { User, WallPostVisibility } from '@/types/database'

interface CreatePostProps {
  user: User
  onPost: (content: string, mediaUrls: string[], visibility: WallPostVisibility) => Promise<void>
}

const visibilityOptions: { value: WallPostVisibility; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'connections', label: 'Connections', icon: <Users className="w-4 h-4" />, description: 'All your connections' },
  { value: 'close_friends', label: 'Close Friends', icon: <Heart className="w-4 h-4" />, description: 'Only close friends (5+ meetups)' },
  { value: 'community', label: 'Community', icon: <Globe className="w-4 h-4" />, description: 'Your community members' },
]

export function CreatePost({ user, onPost }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [visibility, setVisibility] = useState<WallPostVisibility>('connections')
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePost = async () => {
    if (!content.trim() && mediaUrls.length === 0) return

    setIsPosting(true)
    try {
      await onPost(content, mediaUrls, visibility)
      setContent('')
      setMediaUrls([])
      setIsFocused(false)
    } finally {
      setIsPosting(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // For now, create object URLs (in production, upload to storage)
    const newUrls = Array.from(files).map(file => URL.createObjectURL(file))
    setMediaUrls(prev => [...prev, ...newUrls].slice(0, 4)) // Max 4 images
  }

  const removeImage = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index))
  }

  const selectedVisibility = visibilityOptions.find(v => v.value === visibility)!

  return (
    <div className="card-dark p-4">
      {/* User avatar and input */}
      <div className="flex gap-3">
        {/* Avatar */}
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name || 'You'}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-coral-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-coral-500">
              {(user.name || 'U')[0].toUpperCase()}
            </span>
          </div>
        )}

        {/* Input area */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Share a moment with your tribe..."
            className="w-full bg-transparent text-text-primary placeholder-text-muted resize-none outline-none min-h-[60px]"
            rows={isFocused ? 3 : 2}
          />

          {/* Image previews */}
          <AnimatePresence>
            {mediaUrls.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2 mt-3"
              >
                {mediaUrls.map((url, index) => (
                  <div key={url} className="relative aspect-video rounded-lg overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions bar */}
          <AnimatePresence>
            {(isFocused || content || mediaUrls.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between mt-3 pt-3 border-t border-dark-border"
              >
                {/* Left actions */}
                <div className="flex items-center gap-2">
                  {/* Image upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-text-muted hover:text-coral-500 hover:bg-coral-500/10 rounded-lg transition-colors"
                    title="Add photos"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {/* Visibility selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-dark-surface rounded-lg transition-colors"
                    >
                      {selectedVisibility.icon}
                      <span>{selectedVisibility.label}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    <AnimatePresence>
                      {showVisibilityDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute bottom-full left-0 mb-2 w-56 card-dark-elevated rounded-xl overflow-hidden z-10"
                        >
                          {visibilityOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setVisibility(option.value)
                                setShowVisibilityDropdown(false)
                              }}
                              className={`w-full flex items-start gap-3 p-3 hover:bg-dark-surface transition-colors ${
                                visibility === option.value ? 'bg-dark-surface' : ''
                              }`}
                            >
                              <div className="text-text-muted mt-0.5">{option.icon}</div>
                              <div className="text-left">
                                <div className="text-sm font-medium text-text-primary">{option.label}</div>
                                <div className="text-xs text-text-muted">{option.description}</div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Post button */}
                <button
                  onClick={handlePost}
                  disabled={isPosting || (!content.trim() && mediaUrls.length === 0)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-coral-500 to-urgent-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
