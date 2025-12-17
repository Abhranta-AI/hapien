'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  Check,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  Edit2,
  X,
  Trash2,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/Badge'
import { LoadingScreen } from '@/components/ui/Loading'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { HangoutWithRelations, Comment, User } from '@/types/database'
import { cn, categoryConfig } from '@/utils/helpers'
import toast from 'react-hot-toast'

export default function HangoutDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [hangout, setHangout] = useState<HangoutWithRelations | null>(null)
  const [comments, setComments] = useState<(Comment & { user: User })[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRsvpLoading, setIsRsvpLoading] = useState(false)
  const [isCommentLoading, setIsCommentLoading] = useState(false)
  const [showHostMenu, setShowHostMenu] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const fetchHangout = useCallback(async () => {
    const hangoutId = params.id as string

    try {
      const { data, error } = await supabase
        .from('hangouts')
        .select(`
          *,
          host:users!host_id(*),
          community:communities!community_id(*),
          rsvps:hangout_rsvps(*, user:users!user_id(*))
        `)
        .eq('id', hangoutId)
        .single()

      if (error) throw error

      const transformedHangout: HangoutWithRelations = {
        ...(data as any),
        host: (data as any).host,
        community: (data as any).community,
        rsvps: (data as any).rsvps || [],
        comments: [],
        going_count: (data as any).rsvps?.filter((r: any) => r.status === 'going').length || 0,
        interested_count: (data as any).rsvps?.filter((r: any) => r.status === 'interested').length || 0,
      }

      setHangout(transformedHangout)

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, user:users!user_id(*)')
        .eq('hangout_id', hangoutId)
        .order('created_at', { ascending: true })

      setComments(commentsData || [])
    } catch (error) {
      console.error('Error fetching hangout:', error)
      toast.error('Failed to load hangout')
    } finally {
      setIsLoading(false)
    }
  }, [params.id, supabase])

  useEffect(() => {
    fetchHangout()
  }, [fetchHangout])

  const handleRsvp = async (status: 'interested' | 'going') => {
    if (!user || !hangout) return

    setIsRsvpLoading(true)
    const userRsvp = hangout.rsvps?.find(r => r.user_id === user.id)

    try {
      if (userRsvp?.status === status) {
        await supabase.from('hangout_rsvps').delete().eq('id', userRsvp.id)
        toast.success('RSVP removed')
      } else if (userRsvp) {
        await (supabase.from('hangout_rsvps') as any).update({ status }).eq('id', userRsvp.id)
        toast.success(status === 'going' ? "You're going!" : "Marked as interested")
      } else {
        await (supabase.from('hangout_rsvps') as any).insert({
          hangout_id: hangout.id,
          user_id: user.id,
          status,
        })
        toast.success(status === 'going' ? "You're going!" : "Marked as interested")
      }

      fetchHangout()
    } catch (error) {
      console.error('RSVP error:', error)
      toast.error('Something went wrong')
    } finally {
      setIsRsvpLoading(false)
    }
  }

  const handleComment = async () => {
    if (!user || !hangout || !newComment.trim()) return

    setIsCommentLoading(true)

    try {
      const { error } = await (supabase.from('comments') as any).insert({
        hangout_id: hangout.id,
        user_id: user.id,
        content: newComment.trim(),
      })

      if (error) throw error

      setNewComment('')
      fetchHangout()
      toast.success('Comment posted')
    } catch (error) {
      console.error('Comment error:', error)
      toast.error('Failed to post comment')
    } finally {
      setIsCommentLoading(false)
    }
  }

  const handleShare = async () => {
    if (!hangout) return

    try {
      await navigator.share({
        title: hangout.title,
        text: `Check out this hangout: ${hangout.title}`,
        url: window.location.href,
      })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  const handleCancelHangout = async () => {
    if (!hangout || !user || hangout.host_id !== user.id) return

    if (!confirm('Are you sure you want to cancel this hangout? This action cannot be undone.')) return

    setIsCancelling(true)

    try {
      const { error } = await (supabase
        .from('hangouts') as any)
        .update({ status: 'cancelled' })
        .eq('id', hangout.id)

      if (error) throw error

      toast.success('Hangout cancelled')
      router.push('/hangouts')
    } catch (error) {
      console.error('Cancel error:', error)
      toast.error('Failed to cancel hangout')
    } finally {
      setIsCancelling(false)
    }
  }

  const isHost = user?.id === hangout?.host_id

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!hangout) {
    return (
      <AppShell>
        <main className="min-h-screen pt-16 pb-24 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-neutral-100">Hangout not found</h1>
            <Link href="/hangouts" className="text-primary-400 hover:underline mt-2 inline-block">
              Browse hangouts
            </Link>
          </div>
        </main>
      </AppShell>
    )
  }

  const userRsvp = hangout.rsvps?.find(r => r.user_id === user?.id)
  const goingUsers = hangout.rsvps?.filter(r => r.status === 'going') || []
  const interestedUsers = hangout.rsvps?.filter(r => r.status === 'interested') || []
  const hangoutDate = new Date(hangout.date_time)
  const isToday = new Date().toDateString() === hangoutDate.toDateString()
  const isPast = hangoutDate < new Date()
  const categoryInfo = categoryConfig[hangout.category]

  return (
    <AppShell>
      <main className="min-h-screen pt-16 pb-24">
        {/* Cover Image */}
        <div className={cn(
          'h-64 relative',
          hangout.cover_image_url ? '' : `bg-gradient-to-br ${categoryInfo.gradient}`
        )}>
          {hangout.cover_image_url ? (
            <img
              src={hangout.cover_image_url}
              alt={hangout.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl">{categoryInfo.emoji}</span>
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 p-2 bg-dark-card/20 backdrop-blur-sm rounded-full text-white hover:bg-dark-card/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleShare}
              className="p-2 bg-dark-card/20 backdrop-blur-sm rounded-full text-white hover:bg-dark-card/30 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            
            {/* Host Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowHostMenu(!showHostMenu)}
                className="p-2 bg-dark-card/20 backdrop-blur-sm rounded-full text-white hover:bg-dark-card/30 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showHostMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowHostMenu(false)} 
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-dark-card rounded-xl shadow-soft-lg border border-dark-border py-1 z-20">
                    {isHost && hangout.status === 'upcoming' && (
                      <>
                        <Link
                          href={`/hangouts/${hangout.id}/edit`}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-300 hover:bg-dark-bg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit hangout</span>
                        </Link>
                        <button
                          onClick={handleCancelHangout}
                          disabled={isCancelling}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-tertiary-300 hover:bg-tertiary-900/30 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>{isCancelling ? 'Cancelling...' : 'Cancel hangout'}</span>
                        </button>
                      </>
                    )}
                    {!isHost && (
                      <button
                        onClick={() => {
                          setShowHostMenu(false)
                          toast.success('Hangout reported')
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-300 hover:bg-dark-bg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Report</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Title on cover */}
          <div className="absolute bottom-4 left-4 right-4">
            <CategoryBadge category={hangout.category} className="mb-2" />
            <h1 className="text-2xl font-display font-bold text-white">
              {hangout.title}
            </h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Host Info */}
          <Card variant="elevated" padding="md">
            <div className="flex items-center gap-3">
              <Avatar
                src={hangout.host.avatar_url}
                name={hangout.host.name || 'Host'}
                size="lg"
              />
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Hosted by</p>
                <Link
                  href={`/profile/${hangout.host.id}`}
                  className="font-semibold text-neutral-100 hover:text-primary-400"
                >
                  {hangout.host.name}
                </Link>
              </div>
              <Link href={`/communities/${hangout.community.id}`}>
                <span className="text-sm text-neutral-500 hover:text-primary-400">
                  in {hangout.community.name}
                </span>
              </Link>
            </div>
          </Card>

          {/* Details */}
          <Card variant="elevated" padding="md">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className={cn(
                    'font-medium',
                    isToday ? 'text-secondary-600' : 'text-neutral-100'
                  )}>
                    {isToday ? 'Today' : hangoutDate.toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {hangoutDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {hangout.location && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-tertiary-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-tertiary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-100">
                      {hangout.location.place_name || hangout.location.address}
                    </p>
                    <button className="text-sm text-primary-400 hover:underline">
                      View on map
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Users className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-100">
                    {goingUsers.length} going · {interestedUsers.length} interested
                  </p>
                  {hangout.max_participants && (
                    <p className="text-sm text-neutral-500">
                      {hangout.max_participants - goingUsers.length} spots left
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Description */}
          {hangout.description && (
            <Card variant="elevated" padding="md">
              <h2 className="font-semibold text-neutral-100 mb-2">About</h2>
              <p className="text-neutral-400 whitespace-pre-wrap">{hangout.description}</p>
            </Card>
          )}

          {/* RSVP Buttons */}
          {!isPast && (
            <div className="flex gap-3">
              <Button
                variant={userRsvp?.status === 'interested' ? 'primary' : 'outline'}
                size="lg"
                className="flex-1"
                onClick={() => handleRsvp('interested')}
                disabled={isRsvpLoading}
              >
                <Star className={cn(
                  'w-5 h-5 mr-2',
                  userRsvp?.status === 'interested' && 'fill-current'
                )} />
                Interested
              </Button>
              <Button
                variant={userRsvp?.status === 'going' ? 'primary' : 'secondary'}
                size="lg"
                className="flex-1"
                onClick={() => handleRsvp('going')}
                disabled={isRsvpLoading}
              >
                <Check className="w-5 h-5 mr-2" />
                Going
              </Button>
            </div>
          )}

          {/* Participants */}
          {goingUsers.length > 0 && (
            <Card variant="elevated" padding="md">
              <h2 className="font-semibold text-neutral-100 mb-4">
                Who&apos;s Going ({goingUsers.length})
              </h2>
              <div className="flex flex-wrap gap-3">
                {goingUsers.map((rsvp) => (
                  <Link
                    key={rsvp.id}
                    href={`/profile/${rsvp.user.id}`}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-dark-bg transition-colors"
                  >
                    <Avatar
                      src={rsvp.user.avatar_url}
                      name={rsvp.user.name || 'User'}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-neutral-100">
                      {rsvp.user.name}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Comments */}
          <Card variant="elevated" padding="md">
            <h2 className="font-semibold text-neutral-100 mb-4">
              <MessageCircle className="w-5 h-5 inline mr-2" />
              Comments ({comments.length})
            </h2>

            {/* Comment Input */}
            {user && (
              <div className="flex gap-3 mb-4">
                <Avatar
                  src={user.avatar_url}
                  name={user.name || 'You'}
                  size="sm"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 bg-dark-bg rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  />
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={!newComment.trim() || isCommentLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar
                    src={comment.user.avatar_url}
                    name={comment.user.name || 'User'}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="bg-dark-bg rounded-2xl px-4 py-2">
                      <Link
                        href={`/profile/${comment.user.id}`}
                        className="font-medium text-neutral-100 hover:text-primary-400"
                      >
                        {comment.user.name}
                      </Link>
                      <p className="text-neutral-300">{comment.content}</p>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 ml-2">
                      {new Date(comment.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-neutral-500 py-4">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </AppShell>
  )
}
