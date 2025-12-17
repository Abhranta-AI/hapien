'use client'

import { Shield, Lock, Eye, EyeOff, Heart, Feather, UserCheck } from 'lucide-react'
import { cn } from '@/utils/helpers'

// Safe Space Badge - communicates privacy and trust levels
export type SafeSpaceType = 'private' | 'trusted' | 'anonymous' | 'vulnerable' | 'protected'

interface SafeSpaceBadgeProps {
  type: SafeSpaceType
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const safeSpaceConfig: Record<SafeSpaceType, {
  icon: typeof Shield
  color: string
  label: string
  tooltip: string
}> = {
  private: {
    icon: Shield,
    color: 'bg-sage-50 text-sage-600 border-sage-200',
    label: 'Private',
    tooltip: 'Only you and invited members can see this',
  },
  trusted: {
    icon: Heart,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
    label: 'Trusted Circle',
    tooltip: 'Shared only with close connections',
  },
  anonymous: {
    icon: EyeOff,
    color: 'bg-stone-100 text-stone-500 border-stone-200',
    label: 'Anonymous',
    tooltip: 'Your identity is hidden',
  },
  vulnerable: {
    icon: Feather,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    label: 'Safe to Share',
    tooltip: 'A space for authentic expression',
  },
  protected: {
    icon: Lock,
    color: 'bg-sage-50 text-sage-600 border-sage-200',
    label: 'Protected',
    tooltip: 'Your data is encrypted and secure',
  },
}

export function SafeSpaceBadge({
  type,
  size = 'md',
  showLabel = true,
  className,
}: SafeSpaceBadgeProps) {
  const config = safeSpaceConfig[type]
  const Icon = config.icon

  const sizes = {
    sm: { badge: 'px-2 py-1 gap-1 text-xs', icon: 'w-3 h-3' },
    md: { badge: 'px-3 py-1.5 gap-1.5 text-sm', icon: 'w-4 h-4' },
    lg: { badge: 'px-4 py-2 gap-2 text-base', icon: 'w-5 h-5' },
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        'transition-colors duration-200',
        config.color,
        sizes[size].badge,
        className
      )}
      title={config.tooltip}
    >
      <Icon className={sizes[size].icon} />
      {showLabel && <span>{config.label}</span>}
    </div>
  )
}

// Trust Level Indicator - shows relationship trust progression
interface TrustLevelProps {
  current: number
  max?: number
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function TrustLevel({
  current,
  max = 5,
  size = 'md',
  showLabel = true,
  className,
}: TrustLevelProps) {
  const levels = Array.from({ length: max }, (_, i) => i + 1)

  const sizes = {
    sm: { dot: 'w-1.5 h-1.5', gap: 'gap-0.5', text: 'text-xs' },
    md: { dot: 'w-2 h-2', gap: 'gap-1', text: 'text-sm' },
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex', sizes[size].gap)}>
        {levels.map((level) => (
          <div
            key={level}
            className={cn(
              'rounded-full transition-colors duration-300',
              sizes[size].dot,
              level <= current ? 'bg-amber-500' : 'bg-stone-200'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn('text-stone-500', sizes[size].text)}>
          Trust Level {current}/{max}
        </span>
      )}
    </div>
  )
}

// Privacy Indicator - shows current privacy state
interface PrivacyIndicatorProps {
  visibility: 'only-me' | 'friends' | 'trusted' | 'community' | 'public'
  size?: 'sm' | 'md'
  className?: string
}

const visibilityConfig: Record<string, { icon: typeof Eye; label: string; color: string }> = {
  'only-me': { icon: Lock, label: 'Only visible to you', color: 'text-sage-600 bg-sage-50' },
  friends: { icon: UserCheck, label: 'Friends only', color: 'text-amber-600 bg-amber-50' },
  trusted: { icon: Heart, label: 'Trusted circle', color: 'text-rose-600 bg-rose-50' },
  community: { icon: Shield, label: 'Community members', color: 'text-amber-600 bg-amber-50' },
  public: { icon: Eye, label: 'Everyone', color: 'text-stone-500 bg-stone-100' },
}

export function PrivacyIndicator({
  visibility,
  size = 'md',
  className,
}: PrivacyIndicatorProps) {
  const config = visibilityConfig[visibility]
  const Icon = config.icon

  const sizes = {
    sm: { wrapper: 'px-2 py-1 gap-1 text-xs', icon: 'w-3 h-3' },
    md: { wrapper: 'px-3 py-1.5 gap-1.5 text-sm', icon: 'w-4 h-4' },
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.color,
        sizes[size].wrapper,
        className
      )}
    >
      <Icon className={sizes[size].icon} />
      <span>{config.label}</span>
    </div>
  )
}

// Gradual Reveal Progress - shows how much of profile is revealed
interface GradualRevealProps {
  level: number
  maxLevel?: number
  className?: string
}

const revealLevels = [
  { level: 1, label: 'Interests only' },
  { level: 2, label: 'Avatar revealed' },
  { level: 3, label: 'Name revealed' },
  { level: 4, label: 'Location shared' },
  { level: 5, label: 'Full profile' },
]

export function GradualReveal({
  level,
  maxLevel = 5,
  className,
}: GradualRevealProps) {
  const currentLabel = revealLevels.find(r => r.level === level)?.label || ''

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-stone-500">Profile visibility</span>
        <span className="text-sm font-medium text-stone-700">{currentLabel}</span>
      </div>
      <div className="relative h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all duration-500"
          style={{ width: `${(level / maxLevel) * 100}%` }}
        />
      </div>
      <div className="flex justify-between">
        {revealLevels.slice(0, maxLevel).map((r) => (
          <div
            key={r.level}
            className={cn(
              'w-2 h-2 rounded-full',
              r.level <= level ? 'bg-amber-500' : 'bg-stone-200'
            )}
          />
        ))}
      </div>
    </div>
  )
}

// Safe Space Card Wrapper - wraps content in a safe space indicator
interface SafeSpaceCardProps {
  type: SafeSpaceType
  children: React.ReactNode
  className?: string
}

export function SafeSpaceCard({ type, children, className }: SafeSpaceCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-4 border',
        type === 'private' && 'bg-sage-50/50 border-sage-200',
        type === 'trusted' && 'bg-rose-50/50 border-rose-200',
        type === 'vulnerable' && 'bg-amber-50/50 border-amber-200',
        type === 'anonymous' && 'bg-stone-50 border-stone-200',
        type === 'protected' && 'bg-sage-50/50 border-sage-200',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <SafeSpaceBadge type={type} size="sm" />
      </div>
      {children}
    </div>
  )
}

// Safe Space Footer - privacy assurance at bottom of forms/cards
interface SafeSpaceFooterProps {
  message?: string
  className?: string
}

export function SafeSpaceFooter({
  message = 'Your data is encrypted and never shared outside Hapien',
  className,
}: SafeSpaceFooterProps) {
  return (
    <div className={cn('flex items-center gap-1.5 text-xs text-stone-400', className)}>
      <Lock className="w-3 h-3" />
      <span>{message}</span>
    </div>
  )
}
