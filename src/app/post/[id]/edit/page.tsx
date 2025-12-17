'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Image as ImageIcon,
  X,
  Users,
  ChevronDown,
  Trash2,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Avatar, Button, Card, Modal } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Post, PostVisibility } from '@/types/database'
import { cn, visibilityConfig } from '@/utils/helpers'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface EditPostPageProps {
  params: { id: string }
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [post, setPost] = useState<Post | null>(null)
  const [content, setContent] = useState('')
  const [existingMedia, setExistingMedia] = useState<string[]>([])
  const [newMedia, setNewMedia] = useState<File[]>([])
  const [newMediaPreviews, setNewMediaPreviews] = useState<string[]>([])
  const [visibility, setVisibility] = useState<PostVisibility>('friends')
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        toast.error('Post not found')
        router.push('/feed')
        return
      }

      const postData = data as unknown as Post

      // Check if user owns this post
      if (postData.user_id !== user.id) {
        toast.error('You can only edit your own posts')
        router.push('/feed')
        return
      }

      setPost(postData)
      setContent(postData.content || '')
      setExistingMedia(postData.media_urls || [])
      setVisibility(postData.visibility)
      setIsLoading(false)
    }

    if (user) {
      fetchPost()
    }
  }, [user, params.id, supabase, router])

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const totalMedia = existingMedia.length + newMedia.length + files.length
    const allowedNew = Math.max(0, 4 - existingMedia.length - newMedia.length)
    const filesToAdd = files.slice(0, allowedNew)

    setNewMedia([...newMedia, ...filesToAdd])
    setNewMediaPreviews([...newMediaPreviews, ...filesToAdd.map(f => URL.createObjectURL(f))])
  }

  const removeExistingMedia = (index: number) => {
    setExistingMedia(existingMedia.filter((_, i) => i !== index))
  }

  const removeNewMedia = (index: number) => {
    setNewMedia(newMedia.filter((_, i) => i !== index))
    setNewMediaPreviews(newMediaPreviews.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!user || !post) return

    setIsSaving(true)

    try {
      // Upload new media files
      const uploadedUrls: string[] = []
      
      for (const file of newMedia) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      }

      // Combine existing and new media
      const allMediaUrls = [...existingMedia, ...uploadedUrls]

      // Update post
      const { error: updateError } = await (supabase
        .from('posts') as any)
        .update({
          content: content.trim() || null,
          media_urls: allMediaUrls.length > 0 ? allMediaUrls : null,
          visibility,
        })
        .eq('id', post.id)

      if (updateError) throw updateError

      toast.success('Post updated!')
      router.push(`/post/${post.id}`)
    } catch (error) {
      console.error('Error updating post:', error)
      toast.error('Failed to update post')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !post) return

    setIsDeleting(true)

    try {
      // Delete media from storage if any
      if (post.media_urls && post.media_urls.length > 0) {
        for (const url of post.media_urls) {
          const path = url.split('/posts/')[1]
          if (path) {
            await supabase.storage.from('posts').remove([path])
          }
        }
      }

      // Delete post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)

      if (error) throw error

      toast.success('Post deleted')
      router.push('/feed')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    } finally {
      setIsDeleting(false)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!user || !post) {
    return null
  }

  const totalMedia = existingMedia.length + newMedia.length

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Back button */}
          <Link
            href={`/post/${post.id}`}
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-100 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Post
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-display font-bold text-neutral-100">
              Edit Post
            </h1>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-tertiary-300 hover:bg-tertiary-900/30"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>

          <Card variant="elevated" padding="lg">
            <div className="flex gap-3">
              <Avatar
                src={user.avatar_url}
                name={user.name || 'User'}
                size="md"
              />
              <div className="flex-1 space-y-4">
                <textarea
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full resize-none bg-transparent text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                />

                {/* Existing Media */}
                {existingMedia.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-500">Current media</p>
                    <div className={cn(
                      'grid gap-2',
                      existingMedia.length === 1 && 'grid-cols-1',
                      existingMedia.length >= 2 && 'grid-cols-2',
                    )}>
                      {existingMedia.map((url, index) => (
                        <div
                          key={url}
                          className="relative aspect-square rounded-xl overflow-hidden bg-dark-elevated"
                        >
                          {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                            <video
                              src={url}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            onClick={() => removeExistingMedia(index)}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Media Previews */}
                {newMediaPreviews.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-500">New media</p>
                    <div className={cn(
                      'grid gap-2',
                      newMediaPreviews.length === 1 && 'grid-cols-1',
                      newMediaPreviews.length >= 2 && 'grid-cols-2',
                    )}>
                      {newMediaPreviews.map((preview, index) => (
                        <div
                          key={preview}
                          className="relative aspect-square rounded-xl overflow-hidden bg-dark-elevated"
                        >
                          <img
                            src={preview}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeNewMedia(index)}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-dark-border">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={totalMedia >= 4}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        totalMedia >= 4
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-neutral-500 hover:text-primary-500 hover:bg-primary-900/30'
                      )}
                      title={totalMedia >= 4 ? 'Maximum 4 media files' : 'Add media'}
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>

                    {/* Visibility selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 hover:bg-dark-elevated rounded-lg transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        <span>{visibilityConfig[visibility].label}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {showVisibilityMenu && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-dark-card rounded-xl shadow-soft-lg border border-dark-border py-1 z-10">
                          {Object.entries(visibilityConfig).slice(0, 3).map(([key, config]) => (
                            <button
                              key={key}
                              onClick={() => {
                                setVisibility(key as PostVisibility)
                                setShowVisibilityMenu(false)
                              }}
                              className={cn(
                                'w-full px-4 py-2 text-left hover:bg-dark-bg transition-colors',
                                visibility === key && 'bg-primary-900/30'
                              )}
                            >
                              <p className="font-medium text-neutral-100">{config.label}</p>
                              <p className="text-xs text-neutral-500">{config.description}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    isLoading={isSaving}
                    disabled={!content.trim() && totalMedia === 0}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Post"
      >
        <p className="text-neutral-400 mb-6">
          Are you sure you want to delete this post? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-tertiary-900/300 hover:bg-red-600"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete Post
          </Button>
        </div>
      </Modal>

    </AppShell>
  )
}
