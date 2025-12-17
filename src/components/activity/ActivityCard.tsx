'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Users, Zap } from 'lucide-react'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { User, HangoutWithRelations } from '@/types/database'
import { cn, categoryConfig } from '@/utils/helpers'

export interface ActivityCardProps {
  activity: HangoutWithRelations
  variant?: 'default' | 'featured' | 'compact'
  onJoin?: (activityId: string) => void
  isJoining?: boolean
}

// Calculate time until activity starts
function getTimeUntil(dateTime: string): { label: string; isUrgent: boolean; minutes: number } {
  const now = new Date()
  const target = new Date(dateTime)
  const diffMs = target.getTime() - now.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins <= 0) {
    return { label: 'NOW', isUrgent: true, minutes: 0 }
  }
  if (diffMins <= 15) {
    return { label: `${diffMins} min`, isUrgent: true, minutes: diffMins }
  }
  if (diffMins <= 60) {
    return { label: `${diffMins} min`, isUrgent: false, minutes: diffMins }
  }
  if (diffHours <= 3) {
    return { label: `${diffHours}h ${diffMins % 60}m`, isUrgent: false, minutes: diffMins }
  }

  const hours = target.getHours()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return {
    label: `${displayHour}:${target.getMinutes().toString().padStart(2, '0')} ${ampm}`,
    isUrgent: false,
    minutes: diffMins
  }
}

export function ActivityCard({
  activity,
  variant = 'default',
  onJoin,
  isJoining = false
}: ActivityCardProps) {
  const [timeUntil, setTimeUntil] = useState(() => getTimeUntil(activity.date_time))

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntil(getTimeUntil(activity.date_time))
    }, 60000)
    return () => clearInterval(interval)
  }, [activity.date_time])

  const category = categoryConfig[activity.category as keyof typeof categoryConfig] || categoryConfig.chill
  const goingUsers = activity.rsvps?.filter(r => r.status === 'going') || []
  const spotsLeft = activity.max_participants
    ? activity.max_participants - goingUsers.length
    : null
  const isFull = spotsLeft !== null && spotsLeft <= 0
  const isLowSpots = spotsLeft !== null && spotsLeft <= 2 && spotsLeft > 0

  // Featured card - larger, more prominent for "Happening Now" items
  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-2xl',
          'bg-dark-surface/80 backdrop-blur-xl',
          'border',
          timeUntil.isUrgent
            ? 'border-urgent-500/40 shadow-glow-urgent'
            : 'border-dark-border hover:border-coral-500/30',
          'transition-all duration-200'
        )}
      >
        {/* Urgency Banner */}
        {timeUntil.isUrgent && (
          <div className="bg-gradient-to-r from-urgent-500 to-coral-500 px-4 py-2 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-white animate-pulse" />
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Starting Soon
            </span>
          </div>
        )}

        <div className="p-5">
          {/* Header: Category + Time */}
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full',
              category.color,
              'border',
              category.borderColor
            )}>
              <span className="text-lg">{category.emoji}</span>
              <span className={cn('font-semibold text-sm', category.textColor)}>
                {category.label}
              </span>
            </div>

            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              timeUntil.isUrgent
                ? 'bg-urgent-500/20 text-urgent-400 animate-pulse'
                : 'bg-dark-elevated text-text-secondary'
            )}>
              <Clock className="w-4 h-4" />
              <span className="font-bold text-sm">{timeUntil.label}</span>
            </div>
          </div>

          {/* Title + Description */}
          <h3 className="text-xl font-display font-bold text-text-primary mb-2">
            {activity.title}
          </h3>
          {activity.description && (
            <p className="text-text-secondary text-sm line-clamp-2 mb-4">
              {activity.description}
            </p>
          )}

          {/* Location */}
          {activity.location && (
            <div className="flex items-center gap-2 text-text-muted text-sm mb-4">
              <MapPin className="w-4 h-4 text-jade-500" />
              <span>{activity.location.place_name || activity.location.address}</span>
            </div>
          )}

          {/* Participants + Spots */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {goingUsers.length > 0 && (
                <>
                  <AvatarGroup
                    users={goingUsers.slice(0, 4).map(r => r.user)}
                    size="sm"
                    max={4}
                  />
                  <span className="text-text-secondary text-sm">
                    {goingUsers.length} joining
                  </span>
                </>
              )}
            </div>

            {spotsLeft !== null && (
              <div className={cn(
                'px-2.5 py-1 rounded-full text-xs font-bold',
                isFull
                  ? 'bg-dark-elevated text-text-muted'
                  : isLowSpots
                    ? 'bg-urgent-500/20 text-urgent-400 animate-pulse'
                    : 'bg-jade-500/20 text-jade-400'
              )}>
                {isFull ? 'FULL' : `${spotsLeft} spots left`}
              </div>
            )}
          </div>

          {/* Join Button */}
          <button
            onClick={() => onJoin?.(activity.id)}
            disabled={isJoining || isFull}
            className={cn(
              'w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider',
              'transition-all duration-150',
              isFull
                ? 'bg-dark-elevated text-text-muted cursor-not-allowed'
                : 'bg-gradient-to-r from-coral-500 to-coral-600 text-white',
              !isFull && 'shadow-button hover:shadow-glow-coral-lg hover:scale-[1.02] active:scale-100',
              isJoining && 'opacity-70 cursor-wait'
            )}
          >
            {isJoining ? 'Joining...' : isFull ? 'Full' : 'Join Now'}
          </button>
        </div>
      </motion.div>
    )
  }

  // Compact card - for "Later Today" section
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl',
          'bg-dark-surface/60 border border-dark-border',
          'hover:border-coral-500/30 hover:bg-dark-surface/80',
          'transition-all duration-200 cursor-pointer'
        )}
        onClick={() => onJoin?.(activity.id)}
      >
        {/* Category Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
          category.color,
          'border',
          category.borderColor
        )}>
          <span className="text-2xl">{category.emoji}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-text-primary truncate">
            {activity.title}
          </h4>
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeUntil.label}</span>
            {goingUsers.length > 0 && (
              <>
                <span className="text-dark-border">·</span>
                <Users className="w-3.5 h-3.5" />
                <span>{goingUsers.length} going</span>
              </>
            )}
          </div>
        </div>

        {/* Spots indicator */}
        {spotsLeft !== null && !isFull && (
          <div className={cn(
            'px-2 py-1 rounded-full text-xs font-bold flex-shrink-0',
            isLowSpots
              ? 'bg-urgent-500/20 text-urgent-400'
              : 'bg-jade-500/20 text-jade-400'
          )}>
            {spotsLeft} left
          </div>
        )}
      </motion.div>
    )
  }

  // Default card
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-4',
        'bg-dark-surface/80 backdrop-blur-xl',
        'border border-dark-border',
        'hover:border-coral-500/30',
        'transition-all duration-200'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          'flex items-center gap-2 px-2.5 py-1 rounded-full',
          category.color,
          'border',
          category.borderColor
        )}>
          <span>{category.emoji}</span>
          <span className={cn('font-medium text-sm', category.textColor)}>
            {category.label}
          </span>
        </div>

        <div className={cn(
          'flex items-center gap-1 text-sm',
          timeUntil.isUrgent ? 'text-urgent-400 font-bold' : 'text-text-secondary'
        )}>
          <Clock className="w-4 h-4" />
          <span>{timeUntil.label}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-text-primary mb-2">
        {activity.title}
      </h3>

      {/* Description */}
      {activity.description && (
        <p className="text-text-secondary text-sm line-clamp-1 mb-3">
          {activity.description}
        </p>
      )}

      {/* Footer: Participants + Join */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {goingUsers.length > 0 ? (
            <>
              <AvatarGroup
                users={goingUsers.slice(0, 3).map(r => r.user)}
                size="xs"
                max={3}
              />
              <span className="text-text-muted text-xs">
                {goingUsers.length} joining
              </span>
            </>
          ) : (
            <span className="text-text-muted text-xs">Be the first!</span>
          )}
        </div>

        <button
          onClick={() => onJoin?.(activity.id)}
          disabled={isJoining || isFull}
          className={cn(
            'px-4 py-2 rounded-xl font-semibold text-sm',
            'transition-all duration-150',
            isFull
              ? 'bg-dark-elevated text-text-muted cursor-not-allowed'
              : 'bg-coral-500 text-white hover:bg-coral-600 active:scale-95'
          )}
        >
          {isFull ? 'Full' : 'Join'}
        </button>
      </div>
    </motion.div>
  )
}

// Activity card skeleton for loading states
export function ActivityCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'featured' | 'compact' }) {
  if (variant === 'featured') {
    return (
      <div className="rounded-2xl bg-dark-surface/80 border border-dark-border p-5 animate-pulse">
        <div className="flex justify-between mb-4">
          <div className="h-8 w-24 bg-dark-elevated rounded-full" />
          <div className="h-8 w-20 bg-dark-elevated rounded-full" />
        </div>
        <div className="h-6 w-3/4 bg-dark-elevated rounded mb-2" />
        <div className="h-4 w-full bg-dark-elevated rounded mb-4" />
        <div className="h-4 w-1/2 bg-dark-elevated rounded mb-4" />
        <div className="flex justify-between mb-5">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-dark-elevated rounded-full" />
            ))}
          </div>
          <div className="h-6 w-20 bg-dark-elevated rounded-full" />
        </div>
        <div className="h-14 w-full bg-dark-elevated rounded-xl" />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-dark-surface/60 border border-dark-border animate-pulse">
        <div className="w-12 h-12 bg-dark-elevated rounded-xl" />
        <div className="flex-1">
          <div className="h-5 w-3/4 bg-dark-elevated rounded mb-2" />
          <div className="h-4 w-1/2 bg-dark-elevated rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-dark-surface/80 border border-dark-border p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-7 w-20 bg-dark-elevated rounded-full" />
        <div className="h-5 w-16 bg-dark-elevated rounded" />
      </div>
      <div className="h-5 w-3/4 bg-dark-elevated rounded mb-2" />
      <div className="h-4 w-full bg-dark-elevated rounded mb-3" />
      <div className="flex justify-between">
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-6 h-6 bg-dark-elevated rounded-full" />
          ))}
        </div>
        <div className="h-9 w-16 bg-dark-elevated rounded-xl" />
      </div>
    </div>
  )
}
