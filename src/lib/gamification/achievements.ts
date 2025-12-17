/**
 * Achievement System - Core Drive 4: Ownership & Possession
 *
 * Progressive badges that users collect and show off.
 * Tiers: Bronze -> Silver -> Gold -> Platinum
 */

// Achievement tiers
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'locked';

export const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  locked: '#4A4A4A',
} as const;

export const TIER_ORDER: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum'];

// Base achievement definition
export interface AchievementDefinition {
  key: string;
  name: string;
  emoji: string;
  description: string;
  category: 'activity' | 'social' | 'time' | 'special';
  tiers?: number[];  // Progress thresholds for each tier
  isOneTime?: boolean;  // For special achievements without tiers
}

// Achievement progress state
export interface AchievementProgress {
  key: string;
  currentProgress: number;
  currentTier: AchievementTier;
  nextTierProgress?: number;
  unlockedAt?: string;
}

// All achievements
export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  // Activity-specific badges (quantity-based)
  BADMINTON_PRO: {
    key: 'BADMINTON_PRO',
    name: 'Badminton Pro',
    emoji: '🏸',
    description: 'Play badminton with your community',
    category: 'activity',
    tiers: [10, 25, 50, 100],
  },
  COFFEE_REGULAR: {
    key: 'COFFEE_REGULAR',
    name: 'Coffee Regular',
    emoji: '☕',
    description: 'Complete coffee meetups',
    category: 'activity',
    tiers: [10, 25, 50, 100],
  },
  FOODIE: {
    key: 'FOODIE',
    name: 'Foodie',
    emoji: '🍕',
    description: 'Food hangouts completed',
    category: 'activity',
    tiers: [10, 25, 50, 100],
  },
  WALKER: {
    key: 'WALKER',
    name: 'Walker',
    emoji: '🚶',
    description: 'Walking activities completed',
    category: 'activity',
    tiers: [10, 25, 50, 100],
  },
  GYM_RAT: {
    key: 'GYM_RAT',
    name: 'Gym Rat',
    emoji: '💪',
    description: 'Gym sessions completed',
    category: 'activity',
    tiers: [10, 25, 50, 100],
  },
  MOVIE_BUFF: {
    key: 'MOVIE_BUFF',
    name: 'Movie Buff',
    emoji: '🎬',
    description: 'Movie outings completed',
    category: 'activity',
    tiers: [10, 25, 50, 100],
  },
  SHOPPER: {
    key: 'SHOPPER',
    name: 'Shopper',
    emoji: '🛍️',
    description: 'Shopping trips completed',
    category: 'activity',
    tiers: [10, 25, 50, 100],
  },
  GAMER: {
    key: 'GAMER',
    name: 'Gamer',
    emoji: '🎮',
    description: 'Gaming sessions completed',
    category: 'activity',
    tiers: [10, 25, 50, 100],
  },

  // Time-based badges
  EARLY_BIRD: {
    key: 'EARLY_BIRD',
    name: 'Early Bird',
    emoji: '🌅',
    description: 'Activities before 8 AM',
    category: 'time',
    tiers: [5, 15, 30, 50],
  },
  NIGHT_OWL: {
    key: 'NIGHT_OWL',
    name: 'Night Owl',
    emoji: '🦉',
    description: 'Activities after 9 PM',
    category: 'time',
    tiers: [5, 15, 30, 50],
  },
  WEEKEND_WARRIOR: {
    key: 'WEEKEND_WARRIOR',
    name: 'Weekend Warrior',
    emoji: '🗓️',
    description: 'Weekend activities completed',
    category: 'time',
    tiers: [10, 25, 50, 100],
  },

  // Social badges
  SOCIAL_BUTTERFLY: {
    key: 'SOCIAL_BUTTERFLY',
    name: 'Social Butterfly',
    emoji: '🦋',
    description: 'Unique people met',
    category: 'social',
    tiers: [10, 25, 50, 100],
  },
  TRIBE_BUILDER: {
    key: 'TRIBE_BUILDER',
    name: 'Tribe Builder',
    emoji: '👥',
    description: 'Close friends (5+ meetups each)',
    category: 'social',
    tiers: [3, 5, 10, 20],
  },
  CONNECTOR: {
    key: 'CONNECTOR',
    name: 'Connector',
    emoji: '🤝',
    description: 'Introduce people who become friends',
    category: 'social',
    tiers: [3, 10, 25, 50],
  },
  HOST_EXTRAORDINAIRE: {
    key: 'HOST_EXTRAORDINAIRE',
    name: 'Host Extraordinaire',
    emoji: '🎪',
    description: 'Hangouts hosted',
    category: 'social',
    tiers: [10, 25, 50, 100],
  },

  // Special one-time achievements
  FIRST_STEPS: {
    key: 'FIRST_STEPS',
    name: 'First Steps',
    emoji: '🎉',
    description: 'Complete your first hangout',
    category: 'special',
    isOneTime: true,
  },
  WEEK_WARRIOR: {
    key: 'WEEK_WARRIOR',
    name: 'Week Warrior',
    emoji: '⚔️',
    description: 'Maintain a 7-day activity streak',
    category: 'special',
    isOneTime: true,
  },
  MONTH_MASTER: {
    key: 'MONTH_MASTER',
    name: 'Month Master',
    emoji: '👑',
    description: 'Maintain a 30-day activity streak',
    category: 'special',
    isOneTime: true,
  },
  COMMUNITY_PILLAR: {
    key: 'COMMUNITY_PILLAR',
    name: 'Community Pillar',
    emoji: '🏛️',
    description: 'Host 50 hangouts in your community',
    category: 'special',
    isOneTime: true,
  },
  PERFECT_WEEK: {
    key: 'PERFECT_WEEK',
    name: 'Perfect Week',
    emoji: '✨',
    description: 'Complete at least one activity every day for a week',
    category: 'special',
    isOneTime: true,
  },
};

// Get tier from progress
export const getTierFromProgress = (progress: number, tiers: number[]): AchievementTier => {
  if (progress >= tiers[3]) return 'platinum';
  if (progress >= tiers[2]) return 'gold';
  if (progress >= tiers[1]) return 'silver';
  if (progress >= tiers[0]) return 'bronze';
  return 'locked';
};

// Get tier index (0-3 for bronze-platinum, -1 for locked)
export const getTierIndex = (tier: AchievementTier): number => {
  return TIER_ORDER.indexOf(tier as typeof TIER_ORDER[number]);
};

// Get next tier threshold
export const getNextTierThreshold = (progress: number, tiers: number[]): number | null => {
  for (const threshold of tiers) {
    if (progress < threshold) return threshold;
  }
  return null; // Already at platinum
};

// Get achievement progress info
export const getAchievementProgressInfo = (
  achievement: AchievementDefinition,
  progress: number
): {
  currentTier: AchievementTier;
  progressPercent: number;
  nextTierThreshold: number | null;
  progressToNextTier: number;
  isComplete: boolean;
} => {
  if (achievement.isOneTime) {
    return {
      currentTier: progress >= 1 ? 'gold' : 'locked',
      progressPercent: progress >= 1 ? 100 : 0,
      nextTierThreshold: progress >= 1 ? null : 1,
      progressToNextTier: progress >= 1 ? 0 : 1 - progress,
      isComplete: progress >= 1,
    };
  }

  const tiers = achievement.tiers!;
  const currentTier = getTierFromProgress(progress, tiers);
  const nextThreshold = getNextTierThreshold(progress, tiers);
  const currentTierIndex = getTierIndex(currentTier);

  // Calculate progress within current tier
  const prevThreshold = currentTierIndex >= 0 ? tiers[currentTierIndex] : 0;
  const currentThreshold = nextThreshold || tiers[tiers.length - 1];

  const progressInTier = progress - prevThreshold;
  const tierRange = currentThreshold - prevThreshold;
  const progressPercent = tierRange > 0 ? Math.round((progressInTier / tierRange) * 100) : 100;

  return {
    currentTier,
    progressPercent: Math.min(100, progressPercent),
    nextTierThreshold: nextThreshold,
    progressToNextTier: nextThreshold ? nextThreshold - progress : 0,
    isComplete: currentTier === 'platinum',
  };
};

// Check for newly unlocked achievements
export const checkAchievementUnlock = (
  achievementKey: string,
  oldProgress: number,
  newProgress: number
): {
  unlocked: boolean;
  newTier: AchievementTier | null;
  previousTier: AchievementTier;
} => {
  const achievement = ACHIEVEMENTS[achievementKey];
  if (!achievement) {
    return { unlocked: false, newTier: null, previousTier: 'locked' };
  }

  if (achievement.isOneTime) {
    const unlocked = oldProgress < 1 && newProgress >= 1;
    return {
      unlocked,
      newTier: unlocked ? 'gold' : null,
      previousTier: oldProgress >= 1 ? 'gold' : 'locked',
    };
  }

  const tiers = achievement.tiers!;
  const oldTier = getTierFromProgress(oldProgress, tiers);
  const newTier = getTierFromProgress(newProgress, tiers);

  const unlocked = getTierIndex(newTier) > getTierIndex(oldTier);

  return {
    unlocked,
    newTier: unlocked ? newTier : null,
    previousTier: oldTier,
  };
};

// Get all achievements by category
export const getAchievementsByCategory = (category: AchievementDefinition['category']): AchievementDefinition[] => {
  return Object.values(ACHIEVEMENTS).filter(a => a.category === category);
};

// Get achievement display info for UI
export const getAchievementDisplayInfo = (
  achievement: AchievementDefinition,
  progress: number
): {
  name: string;
  emoji: string;
  description: string;
  tier: AchievementTier;
  tierColor: string;
  progress: number;
  progressDisplay: string;
  nextMilestone: number | null;
} => {
  const progressInfo = getAchievementProgressInfo(achievement, progress);

  let progressDisplay = '';
  if (achievement.isOneTime) {
    progressDisplay = progressInfo.isComplete ? 'Unlocked' : 'Locked';
  } else {
    const nextThreshold = progressInfo.nextTierThreshold;
    progressDisplay = nextThreshold ? `${progress}/${nextThreshold}` : `${progress} (Max)`;
  }

  return {
    name: achievement.name,
    emoji: achievement.emoji,
    description: achievement.description,
    tier: progressInfo.currentTier,
    tierColor: TIER_COLORS[progressInfo.currentTier],
    progress,
    progressDisplay,
    nextMilestone: progressInfo.nextTierThreshold,
  };
};
