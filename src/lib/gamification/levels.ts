/**
 * Level System - Core Drive 2: Development & Accomplishment
 *
 * Clear progression with unlocks at each level tier.
 * ~40% XP increase per level for satisfying but achievable progression.
 */

// Level thresholds (XP required to reach each level)
export const LEVEL_THRESHOLDS = [
  0,      // Level 1 - Starting
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5 - First major unlock
  1300,   // Level 6
  1900,   // Level 7
  2700,   // Level 8
  3800,   // Level 9
  5200,   // Level 10 - Priority matching unlock
  7000,   // Level 11
  9500,   // Level 12
  12500,  // Level 13
  16500,  // Level 14
  21500,  // Level 15 - Host community events unlock
  28000,  // Level 16
  36500,  // Level 17
  47500,  // Level 18
  61500,  // Level 19
  80000,  // Level 20 - Tribe Leader badge
] as const;

// Level titles for display
export const LEVEL_TITLES: Record<number, string> = {
  1: 'Newcomer',
  2: 'Explorer',
  3: 'Connector',
  4: 'Socializer',
  5: 'Community Member',
  6: 'Active Member',
  7: 'Regular',
  8: 'Enthusiast',
  9: 'Champion',
  10: 'Leader',
  11: 'Veteran',
  12: 'Expert',
  13: 'Master',
  14: 'Elite',
  15: 'Ambassador',
  16: 'Legend',
  17: 'Icon',
  18: 'Hero',
  19: 'Guardian',
  20: 'Tribe Leader',
};

// Level-based unlocks
export interface LevelUnlock {
  level: number;
  feature: string;
  description: string;
  icon: string;
}

export const LEVEL_UNLOCKS: LevelUnlock[] = [
  {
    level: 3,
    feature: 'custom_hangouts',
    description: 'Create custom activity types',
    icon: '✏️',
  },
  {
    level: 5,
    feature: 'private_groups',
    description: 'Create private activity groups',
    icon: '🔒',
  },
  {
    level: 7,
    feature: 'activity_insights',
    description: 'See detailed activity analytics',
    icon: '📊',
  },
  {
    level: 10,
    feature: 'priority_matching',
    description: 'Get prioritized in activity matching',
    icon: '⚡',
  },
  {
    level: 15,
    feature: 'host_events',
    description: 'Host community-wide events',
    icon: '🎉',
  },
  {
    level: 20,
    feature: 'tribe_leader_badge',
    description: 'Exclusive Tribe Leader badge',
    icon: '👑',
  },
];

// Calculate level from XP
export const getLevelFromXP = (xp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
};

// Get level title
export const getLevelTitle = (level: number): string => {
  return LEVEL_TITLES[level] || LEVEL_TITLES[20];
};

// Get XP required for specific level
export const getXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  if (level > LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return LEVEL_THRESHOLDS[level - 1];
};

// Get unlocks available at or below a level
export const getUnlocksForLevel = (level: number): LevelUnlock[] => {
  return LEVEL_UNLOCKS.filter(unlock => unlock.level <= level);
};

// Get the next unlock
export const getNextUnlock = (level: number): LevelUnlock | null => {
  return LEVEL_UNLOCKS.find(unlock => unlock.level > level) || null;
};

// Check if a feature is unlocked
export const isFeatureUnlocked = (level: number, feature: string): boolean => {
  const unlock = LEVEL_UNLOCKS.find(u => u.feature === feature);
  return unlock ? level >= unlock.level : true;
};

// Get level progress info
export interface LevelProgressInfo {
  currentLevel: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;  // XP earned in current level
  xpNeeded: number;    // XP needed to level up
  progressPercent: number;
  title: string;
  nextUnlock: LevelUnlock | null;
}

export const getLevelProgressInfo = (xp: number): LevelProgressInfo => {
  const currentLevel = getLevelFromXP(xp);
  const xpForCurrentLevel = getXPForLevel(currentLevel);
  const xpForNextLevel = getXPForLevel(currentLevel + 1);
  const xpProgress = xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xp;
  const levelRange = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = levelRange > 0 ? Math.round((xpProgress / levelRange) * 100) : 100;

  return {
    currentLevel,
    currentXP: xp,
    xpForCurrentLevel,
    xpForNextLevel,
    xpProgress,
    xpNeeded: Math.max(0, xpNeeded),
    progressPercent: Math.min(100, progressPercent),
    title: getLevelTitle(currentLevel),
    nextUnlock: getNextUnlock(currentLevel),
  };
};

// Check if leveling up
export const checkLevelUp = (oldXP: number, newXP: number): {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  newUnlocks: LevelUnlock[];
} => {
  const oldLevel = getLevelFromXP(oldXP);
  const newLevel = getLevelFromXP(newXP);
  const leveledUp = newLevel > oldLevel;

  // Get any new unlocks
  const newUnlocks = leveledUp
    ? LEVEL_UNLOCKS.filter(u => u.level > oldLevel && u.level <= newLevel)
    : [];

  return {
    leveledUp,
    oldLevel,
    newLevel,
    newUnlocks,
  };
};
