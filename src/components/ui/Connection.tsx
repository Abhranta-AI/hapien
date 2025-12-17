'use client'

import { Flame, Sparkles, Calendar, Coffee, MapPin, Clock, Compass, Heart, Gem, Award, Handshake, Shield } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { Avatar, ConnectionStrength } from './Avatar'
import { Card } from './Card'

// Connection Streak - shows relationship consistency
interface ConnectionStreakProps {
  person: {
    name: string
    avatar_url?: string | null
  }
  streakCount: number
  streakType: 'weekly' | 'monthly'
  nextMilestone: number
  className?: string
}

export function ConnectionStreak({
  person,
  streakCount,
  streakType,
  nextMilestone,
  className,
}: ConnectionStreakProps) {
  const streakLabel = streakType === 'weekly' ? 'weeks hanging out' : 'months connecting'

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100',
        className
      )}
    >
      <div className="relative">
        <Avatar
          src={person.avatar_url}
          name={person.name}
          size="md"
          connectionStrength="strong"
          showConnectionRing
        />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-warm">
          <Flame className="w-3 h-3 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-900 truncate">{person.name}</p>
        <p className="text-sm text-stone-500">
          {streakCount} {streakLabel}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-display font-bold text-amber-600">{streakCount}</p>
        <p className="text-xs text-stone-400">
          {nextMilestone - streakCount} to next
        </p>
      </div>
    </div>
  )
}

// Compatibility Hints - shows why two people might connect
interface CompatibilityHint {
  type: 'interest' | 'timing' | 'proximity' | 'activity' | 'serendipity'
  content: string
}

interface CompatibilityHintsProps {
  hints: CompatibilityHint[]
  className?: string
}

const hintIcons = {
  interest: Coffee,
  timing: Clock,
  proximity: MapPin,
  activity: Compass,
  serendipity: Sparkles,
}

const hintColors = {
  interest: 'text-amber-600 bg-amber-50',
  timing: 'text-sage-600 bg-sage-50',
  proximity: 'text-rose-600 bg-rose-50',
  activity: 'text-amber-600 bg-amber-50',
  serendipity: 'text-rose-600 bg-rose-50',
}

export function CompatibilityHints({ hints, className }: CompatibilityHintsProps) {
  return (
    <Card variant="intimate" padding="cozy" className={className}>
      <p className="text-sm text-stone-500 mb-3">You might click because...</p>
      <div className="space-y-2">
        {hints.map((hint, index) => {
          const Icon = hintIcons[hint.type]
          return (
            <div
              key={index}
              className="flex items-center gap-2.5 text-sm"
            >
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center', hintColors[hint.type])}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-stone-700">{hint.content}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Connection Journey - visualizes relationship progression
interface ConnectionJourneyProps {
  currentStage: number
  stages?: Array<{ label: string; icon: typeof Heart }>
  className?: string
}

const defaultStages = [
  { label: 'Connected', icon: Handshake },
  { label: 'Getting to know', icon: Coffee },
  { label: 'Friends', icon: Heart },
  { label: 'Close friend', icon: Shield },
  { label: 'Kindred', icon: Gem },
]

export function ConnectionJourney({
  currentStage,
  stages = defaultStages,
  className,
}: ConnectionJourneyProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const Icon = stage.icon
          const isComplete = index < currentStage
          const isCurrent = index === currentStage

          return (
            <div key={index} className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  isComplete && 'bg-amber-500 text-white',
                  isCurrent && 'bg-rose-500 text-white animate-breathe',
                  !isComplete && !isCurrent && 'bg-stone-100 text-stone-400'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  'text-xs mt-1 text-center max-w-[60px]',
                  isComplete || isCurrent ? 'text-stone-700' : 'text-stone-400'
                )}
              >
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
      {/* Progress bar connecting the stages */}
      <div className="relative h-1 bg-stone-100 rounded-full mx-5">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all duration-500"
          style={{ width: `${(currentStage / (stages.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}

// Milestone Badge - celebrates connection achievements
interface MilestoneBadgeProps {
  milestone: {
    id: string
    label: string
    description: string
    icon: string
    unlocked: boolean
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MilestoneBadge({ milestone, size = 'md', className }: MilestoneBadgeProps) {
  const sizes = {
    sm: { wrapper: 'w-12 h-12', icon: 'text-xl' },
    md: { wrapper: 'w-16 h-16', icon: 'text-2xl' },
    lg: { wrapper: 'w-20 h-20', icon: 'text-3xl' },
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center transition-all duration-300',
          sizes[size].wrapper,
          milestone.unlocked
            ? 'bg-gradient-to-br from-amber-400 to-rose-400 shadow-warm'
            : 'bg-stone-100'
        )}
      >
        <span
          className={cn(
            sizes[size].icon,
            milestone.unlocked ? '' : 'grayscale opacity-50'
          )}
        >
          {milestone.icon}
        </span>
      </div>
      <span
        className={cn(
          'text-xs font-medium text-center',
          milestone.unlocked ? 'text-stone-700' : 'text-stone-400'
        )}
      >
        {milestone.label}
      </span>
    </div>
  )
}

// Milestones Grid - shows all relationship milestones
interface MilestonesGridProps {
  milestones: Array<{
    id: string
    label: string
    description: string
    icon: string
    unlocked: boolean
  }>
  className?: string
}

export function MilestonesGrid({ milestones, className }: MilestonesGridProps) {
  const unlockedCount = milestones.filter(m => m.unlocked).length

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-stone-900">Milestones</h3>
        <span className="text-sm text-stone-500">
          {unlockedCount} / {milestones.length} unlocked
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {milestones.map((milestone) => (
          <MilestoneBadge key={milestone.id} milestone={milestone} size="sm" />
        ))}
      </div>
    </div>
  )
}

// Connection Stats Card - quality-over-quantity metrics
interface ConnectionStatsProps {
  stats: {
    closeFriends: number
    hangoutsHosted: number
    connectionsTotal: number
  }
  className?: string
}

export function ConnectionStats({ stats, className }: ConnectionStatsProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      <div className="text-center p-3 bg-rose-50 rounded-xl">
        <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
        <p className="text-xl font-display font-bold text-stone-900">{stats.closeFriends}</p>
        <p className="text-xs text-stone-500">Close friends</p>
      </div>
      <div className="text-center p-3 bg-amber-50 rounded-xl">
        <Calendar className="w-5 h-5 text-amber-500 mx-auto mb-1" />
        <p className="text-xl font-display font-bold text-stone-900">{stats.hangoutsHosted}</p>
        <p className="text-xs text-stone-500">Hangouts hosted</p>
      </div>
      <div className="text-center p-3 bg-sage-50 rounded-xl">
        <Sparkles className="w-5 h-5 text-sage-500 mx-auto mb-1" />
        <p className="text-xl font-display font-bold text-stone-900">{stats.connectionsTotal}</p>
        <p className="text-xs text-stone-500">Connections</p>
      </div>
    </div>
  )
}

// Default milestones for relationships
export const defaultMilestones = [
  { id: 'first_hangout', label: 'First Hangout', description: 'You met in person!', icon: '🤝', unlocked: false },
  { id: 'week_streak', label: 'Weekly Regulars', description: '4 weeks of meeting up', icon: '🔥', unlocked: false },
  { id: 'shared_interest', label: 'Common Ground', description: 'Discovered 3 shared interests', icon: '🎯', unlocked: false },
  { id: 'trusted_circle', label: 'Inner Circle', description: 'Added to trusted connections', icon: '💛', unlocked: false },
  { id: 'month_streak', label: 'Monthly Bond', description: '3 months of regular hangouts', icon: '🏆', unlocked: false },
  { id: 'deep_talk', label: 'Heart to Heart', description: 'Had a meaningful conversation', icon: '💬', unlocked: false },
  { id: 'kindred', label: 'Kindred Spirit', description: 'A rare, meaningful friendship', icon: '💎', unlocked: false },
  { id: 'anniversary', label: 'One Year', description: 'Connected for a full year', icon: '🎂', unlocked: false },
]
