import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(phone: string): string {
  // Format Indian phone numbers
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular
  return plural || `${singular}s`
}

// Updated with warm palette colors
export function generateAvatarColor(name: string): string {
  const colors = [
    'bg-amber-500',
    'bg-rose-500',
    'bg-sage-500',
    'bg-amber-600',
    'bg-rose-400',
    'bg-sage-400',
    'bg-amber-400',
    'bg-rose-600',
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// Category configuration with warm palette
export const categoryConfig = {
  sports: {
    label: 'Sports',
    color: 'bg-amber-100',
    textColor: 'text-amber-700',
    emoji: '🏃',
    gradient: 'from-amber-500 to-amber-600',
  },
  food: {
    label: 'Food',
    color: 'bg-rose-100',
    textColor: 'text-rose-700',
    emoji: '🍕',
    gradient: 'from-rose-500 to-rose-600',
  },
  shopping: {
    label: 'Shopping',
    color: 'bg-gold-light',
    textColor: 'text-amber-800',
    emoji: '🛍️',
    gradient: 'from-amber-400 to-amber-500',
  },
  learning: {
    label: 'Learning',
    color: 'bg-sage-100',
    textColor: 'text-sage-700',
    emoji: '📚',
    gradient: 'from-sage-500 to-sage-600',
  },
  chill: {
    label: 'Chill',
    color: 'bg-amber-50',
    textColor: 'text-amber-600',
    emoji: '😎',
    gradient: 'from-amber-400 to-rose-400',
  },
  coffee: {
    label: 'Coffee',
    color: 'bg-amber-100',
    textColor: 'text-amber-800',
    emoji: '☕',
    gradient: 'from-amber-600 to-amber-700',
  },
  walk: {
    label: 'Walk',
    color: 'bg-sage-50',
    textColor: 'text-sage-600',
    emoji: '🚶',
    gradient: 'from-sage-400 to-sage-500',
  },
  hobby: {
    label: 'Hobby',
    color: 'bg-rose-50',
    textColor: 'text-rose-600',
    emoji: '🎨',
    gradient: 'from-rose-400 to-rose-500',
  },
} as const

export const communityTypeConfig = {
  society: {
    label: 'Residential Society',
    emoji: '🏠',
    color: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  campus: {
    label: 'College Campus',
    emoji: '🎓',
    color: 'bg-sage-50',
    textColor: 'text-sage-700',
  },
  office: {
    label: 'Office Complex',
    emoji: '🏢',
    color: 'bg-stone-100',
    textColor: 'text-stone-700',
  },
} as const

export const visibilityConfig = {
  friends: {
    label: 'Friends Only',
    description: 'Only your friends can see this',
    icon: 'user-check',
    color: 'text-amber-600 bg-amber-50',
  },
  friends_communities: {
    label: 'Friends & Communities',
    description: 'Friends and community members can see this',
    icon: 'users',
    color: 'text-amber-600 bg-amber-50',
  },
  community_only: {
    label: 'Community Only',
    description: 'Only community members can see this',
    icon: 'shield',
    color: 'text-sage-600 bg-sage-50',
  },
  community: {
    label: 'Community',
    description: 'All community members can see this',
    icon: 'home',
    color: 'text-sage-600 bg-sage-50',
  },
  public_in_community: {
    label: 'Public in Community',
    description: 'Anyone in the community can discover this',
    icon: 'eye',
    color: 'text-stone-600 bg-stone-100',
  },
  only_me: {
    label: 'Only Me',
    description: 'Only you can see this',
    icon: 'lock',
    color: 'text-sage-600 bg-sage-50',
  },
  trusted: {
    label: 'Trusted Circle',
    description: 'Only your trusted connections can see this',
    icon: 'heart',
    color: 'text-rose-600 bg-rose-50',
  },
} as const

// Hangout audience types for 1-on-1 focus
export const audienceConfig = {
  'one-on-one': {
    label: 'Just one person',
    description: 'Looking for a 1-on-1 connection',
    emoji: '👤',
    maxParticipants: 2,
  },
  'small-group': {
    label: 'A few friends',
    description: 'Small group, max 4 people',
    emoji: '👥',
    maxParticipants: 4,
  },
  'couple-date': {
    label: 'Couple date',
    description: 'You + partner meet another couple',
    emoji: '💑',
    maxParticipants: 4,
  },
  open: {
    label: 'Open gathering',
    description: 'Anyone can join',
    emoji: '🎉',
    maxParticipants: null,
  },
} as const

// Connection stage configuration
export const connectionStageConfig = {
  stranger: { level: 0, label: '', icon: '' },
  noticed: { level: 1, label: 'Noticed you', icon: '👀' },
  mutual: { level: 2, label: 'Mutual interest', icon: '✨' },
  acquaintance: { level: 3, label: 'Connected', icon: '👋' },
  connecting: { level: 4, label: 'Getting to know', icon: '🌱' },
  friend: { level: 5, label: 'Friends', icon: '💛' },
  close: { level: 6, label: 'Close friend', icon: '💖' },
  kindred: { level: 7, label: 'Kindred spirit', icon: '💎' },
} as const

// Time-aware greeting
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return then.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

// Format date for hangouts
export function formatHangoutDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isToday = d.toDateString() === now.toDateString()
  const isTomorrow = d.toDateString() === tomorrow.toDateString()

  if (isToday) {
    return `Today at ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  }
  if (isTomorrow) {
    return `Tomorrow at ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  }

  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
