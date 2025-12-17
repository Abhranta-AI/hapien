// Base components
export { Button, IconButton } from './Button'
export { Input } from './Input'
export { Textarea } from './Textarea'
export { Avatar, AvatarGroup, AvatarWithBadge, ConnectionBadge } from './Avatar'
export type { ConnectionStrength } from './Avatar'
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardPremiumAccent } from './Card'
export { Badge, CategoryBadge, ConnectionStageBadge, VerifiedBadge } from './Badge'
export type { ConnectionStage } from './Badge'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'
export { Modal, BottomSheet } from './Modal'
export { EmptyState } from './EmptyState'
export { Spinner, LoadingScreen, LoadingCard, LoadingHangoutCard, PostCardSkeleton, HangoutCardSkeleton } from './Loading'

// Safe space components
export {
  SafeSpaceBadge,
  TrustLevel,
  PrivacyIndicator,
  GradualReveal,
  SafeSpaceCard,
  SafeSpaceFooter,
} from './SafeSpace'
export type { SafeSpaceType } from './SafeSpace'

// Connection/gamification components
export {
  ConnectionStreak,
  CompatibilityHints,
  ConnectionJourney,
  MilestoneBadge,
  MilestonesGrid,
  ConnectionStats,
  defaultMilestones,
} from './Connection'
