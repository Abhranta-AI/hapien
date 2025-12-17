'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  UserPlus,
  UserCheck,
  Calendar,
  Home,
  Heart,
  MessageCircle,
  Check,
  CheckCheck,
  ArrowLeft,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Avatar, Button, Card } from '@/components/ui'
import { LoadingScreen, LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/helpers'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  user_id: string
  type: 'friend_request' | 'friend_accepted' | 'hangout_invite' | 'hangout_rsvp' | 'community_approved' | 'comment' | 'reaction'
  title: string
  body: string | null
  data: Record<string, any>
  read: boolean
  created_at: string
}

const notificationIcons = {
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  hangout_invite: Calendar,
  hangout_rsvp: Calendar,
  community_approved: Home,
  comment: MessageCircle,
  reaction: Heart,
}

const notificationColors = {
  friend_request: 'bg-primary-100 text-primary-400',
  friend_accepted: 'bg-primary-900/50 text-primary-400',
  hangout_invite: 'bg-secondary-100 text-secondary-600',
  hangout_rsvp: 'bg-secondary-100 text-secondary-600',
  community_approved: 'bg-tertiary-100 text-tertiary-600',
  comment: 'bg-blue-100 text-blue-600',
  reaction: 'bg-rose-100 text-rose-600',
}

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications((data || []) as Notification[])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      await (supabase.from('notifications') as any)
        .update({ read: true })
        .eq('id', notificationId)

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      await (supabase.from('notifications') as any)
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )

      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark notifications as read')
    }
  }

  const getNotificationLink = (notification: Notification): string => {
    switch (notification.type) {
      case 'friend_request':
      case 'friend_accepted':
        return notification.data.user_id ? `/profile/${notification.data.user_id}` : '/friends'
      case 'hangout_invite':
      case 'hangout_rsvp':
        return notification.data.hangout_id ? `/hangouts/${notification.data.hangout_id}` : '/hangouts'
      case 'community_approved':
        return notification.data.community_id ? `/communities/${notification.data.community_id}` : '/communities'
      case 'comment':
      case 'reaction':
        if (notification.data.post_id) return `/feed#post-${notification.data.post_id}`
        if (notification.data.hangout_id) return `/hangouts/${notification.data.hangout_id}`
        return '/feed'
      default:
        return '/feed'
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (authLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return null
  }

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/feed"
                  className="p-2 -ml-2 text-neutral-400 hover:text-neutral-400 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-display font-bold text-neutral-100">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary-900/300 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCheck className="w-4 h-4 mr-1.5" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="When you get notifications, they'll appear here"
            />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {notifications.map((notification, index) => {
                  const Icon = notificationIcons[notification.type] || Bell
                  const colorClass = notificationColors[notification.type] || 'bg-dark-elevated text-neutral-400'
                  const link = getNotificationLink(notification)

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Link
                        href={link}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <Card
                          className={cn(
                            'p-4 transition-all hover:shadow-soft-md',
                            !notification.read && 'bg-primary-900/30/50 border-l-4 border-l-primary-500'
                          )}
                        >
                          <div className="flex gap-4">
                            <div className={cn('p-2.5 rounded-full', colorClass)}>
                              <Icon className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'text-neutral-100',
                                !notification.read && 'font-medium'
                              )}>
                                {notification.title}
                              </p>
                              {notification.body && (
                                <p className="text-sm text-neutral-500 mt-0.5 line-clamp-2">
                                  {notification.body}
                                </p>
                              )}
                              <p className="text-xs text-neutral-400 mt-1">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>

                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary-900/300 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>

    </AppShell>
  )
}
