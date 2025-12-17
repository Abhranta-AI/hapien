'use client'

import Image from 'next/image'
import { cn, getInitials, generateAvatarColor } from '@/utils/helpers'

// Connection strength types for relationship depth
export type ConnectionStrength = 'none' | 'new' | 'growing' | 'strong' | 'deep' | 'kindred'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  showOnlineStatus?: boolean
  isOnline?: boolean
  connectionStrength?: ConnectionStrength
  showConnectionRing?: boolean
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
}

const onlineIndicatorSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
}

// Connection strength ring colors (warm palette)
const connectionRingClasses: Record<ConnectionStrength, string> = {
  none: 'ring-stone-200',
  new: 'ring-stone-300',
  growing: 'ring-amber-300',
  strong: 'ring-amber-500',
  deep: 'ring-rose-500',
  kindred: 'ring-rose-600 animate-warm-glow',
}

export function Avatar({
  src,
  name,
  size = 'md',
  className,
  showOnlineStatus = false,
  isOnline = false,
  connectionStrength,
  showConnectionRing = false,
}: AvatarProps) {
  const initials = getInitials(name)
  const bgColor = generateAvatarColor(name)

  const shouldShowRing = showConnectionRing && connectionStrength
  const ringClass = connectionStrength ? connectionRingClasses[connectionStrength] : ''

  return (
    <div className={cn('relative inline-flex', className)}>
      {src ? (
        <div
          className={cn(
            'relative rounded-full overflow-hidden',
            'ring-2 ring-offset-2 ring-offset-white',
            shouldShowRing ? ringClass : 'ring-white',
            'transition-all duration-300',
            'hover:ring-offset-4 hover:scale-105',
            sizeClasses[size]
          )}
        >
          <Image
            src={src}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold text-white',
            'ring-2 ring-offset-2 ring-offset-white',
            shouldShowRing ? ringClass : 'ring-white',
            'transition-all duration-300',
            'hover:ring-offset-4 hover:scale-105',
            sizeClasses[size],
            bgColor
          )}
        >
          {initials}
        </div>
      )}
      {showOnlineStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            onlineIndicatorSizes[size],
            isOnline ? 'bg-sage-500' : 'bg-stone-300'
          )}
        />
      )}
    </div>
  )
}

export interface AvatarGroupProps {
  avatars?: Array<{ src?: string | null; name: string; avatar_url?: string | null; connectionStrength?: ConnectionStrength }>
  users?: Array<{ avatar_url?: string | null; name?: string | null }>
  max?: number
  size?: AvatarProps['size']
  showConnectionRings?: boolean
}

export function AvatarGroup({ avatars, users, max = 4, size = 'sm', showConnectionRings = false }: AvatarGroupProps) {
  // Support both avatars and users props
  const items: Array<{ src?: string | null; name: string; connectionStrength?: ConnectionStrength }> = avatars ||
    (users?.map(u => ({ src: u.avatar_url, name: u.name || 'User' })) || [])

  const visibleAvatars = items.slice(0, max)
  const remainingCount = items.length - max

  return (
    <div className="flex -space-x-2">
      {visibleAvatars.map((avatar, i) => (
        <Avatar
          key={i}
          src={avatar.src}
          name={avatar.name}
          size={size}
          connectionStrength={avatar.connectionStrength}
          showConnectionRing={showConnectionRings}
          className="ring-2 ring-white"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center',
            'bg-stone-100 text-stone-500 font-medium',
            'ring-2 ring-white',
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

// Avatar with connection indicator badge
interface AvatarWithBadgeProps extends AvatarProps {
  badge?: React.ReactNode
  badgePosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
}

export function AvatarWithBadge({
  badge,
  badgePosition = 'bottom-right',
  ...props
}: AvatarWithBadgeProps) {
  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'bottom-right': '-bottom-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-left': '-bottom-1 -left-1',
  }

  return (
    <div className="relative inline-flex">
      <Avatar {...props} />
      {badge && (
        <div className={cn('absolute', positionClasses[badgePosition])}>
          {badge}
        </div>
      )}
    </div>
  )
}

// Connection strength badge for avatar
interface ConnectionBadgeProps {
  strength: ConnectionStrength
  size?: 'sm' | 'md'
}

export function ConnectionBadge({ strength, size = 'sm' }: ConnectionBadgeProps) {
  const icons: Record<ConnectionStrength, string> = {
    none: '',
    new: '👋',
    growing: '🌱',
    strong: '✨',
    deep: '💛',
    kindred: '💎',
  }

  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
  }

  if (strength === 'none') return null

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center',
        'bg-white shadow-soft-sm border border-stone-100',
        sizeClasses[size]
      )}
    >
      {icons[strength]}
    </div>
  )
}
