/**
 * Streak System - Core Drive 8: Loss & Avoidance
 *
 * Streaks create urgency and commitment. The fear of losing a streak
 * motivates continued engagement.
 */

// Streak types
export type StreakType = 'daily' | 'weekly' | 'partner';

// Streak milestone thresholds
export const STREAK_MILESTONES = {
  daily: [3, 7, 14, 30, 60, 100, 365],
  weekly: [2, 4, 8, 12, 26, 52],
  partner: [3, 5, 10, 20, 50, 100],
} as const;

// Streak milestone rewards (XP bonuses)
export const STREAK_MILESTONE_REWARDS = {
  daily: {
    3: 50,
    7: 100,
    14: 200,
    30: 500,
    60: 1000,
    100: 2000,
    365: 5000,
  },
  weekly: {
    2: 75,
    4: 150,
    8: 300,
    12: 500,
    26: 1000,
    52: 2500,
  },
  partner: {
    3: 100,
    5: 200,
    10: 400,
    20: 750,
    50: 1500,
    100: 3000,
  },
} as const;

// Streak status
export interface StreakStatus {
  type: StreakType;
  currentCount: number;
  longestCount: number;
  lastActivityDate: string | null;
  startedAt: string | null;
  isAtRisk: boolean;      // Will expire soon
  timeUntilExpiry: number | null;  // Milliseconds
  nextMilestone: number | null;
  progressToMilestone: number;
}

// Partner streak (tracking specific relationships)
export interface PartnerStreak extends StreakStatus {
  partnerId: string;
  partnerName: string;
}

// Calculate if streak is at risk (less than X hours remaining)
const STREAK_AT_RISK_HOURS = 6; // Show warning 6 hours before midnight

export const isStreakAtRisk = (lastActivityDate: string | null): boolean => {
  if (!lastActivityDate) return false;

  const now = new Date();
  const lastActivity = new Date(lastActivityDate);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Check if last activity was today
  const isToday = lastActivity.toDateString() === now.toDateString();
  if (isToday) return false;

  // Check if we're within risk window
  const hoursUntilMidnight = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilMidnight <= STREAK_AT_RISK_HOURS;
};

// Calculate time until streak expires
export const getTimeUntilStreakExpiry = (lastActivityDate: string | null): number | null => {
  if (!lastActivityDate) return null;

  const now = new Date();
  const lastActivity = new Date(lastActivityDate);

  // If activity was today, no expiry
  if (lastActivity.toDateString() === now.toDateString()) {
    return null;
  }

  // Streak expires at end of today
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return endOfDay.getTime() - now.getTime();
};

// Check if streak should continue or reset
export const shouldStreakContinue = (lastActivityDate: string | null): boolean => {
  if (!lastActivityDate) return false;

  const now = new Date();
  const lastActivity = new Date(lastActivityDate);

  // Same day - streak continues
  if (lastActivity.toDateString() === now.toDateString()) {
    return true;
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return lastActivity.toDateString() === yesterday.toDateString();
};

// Update streak on activity completion
export const updateStreak = (
  currentCount: number,
  longestCount: number,
  lastActivityDate: string | null,
  activityDate: Date = new Date()
): {
  newCount: number;
  newLongest: number;
  isNewStreak: boolean;
  streakBroken: boolean;
  milestoneReached: number | null;
} => {
  const activityDateStr = activityDate.toDateString();

  // First activity ever
  if (!lastActivityDate) {
    return {
      newCount: 1,
      newLongest: Math.max(1, longestCount),
      isNewStreak: true,
      streakBroken: false,
      milestoneReached: null,
    };
  }

  const lastActivity = new Date(lastActivityDate);

  // Same day - no change
  if (lastActivity.toDateString() === activityDateStr) {
    return {
      newCount: currentCount,
      newLongest: longestCount,
      isNewStreak: false,
      streakBroken: false,
      milestoneReached: null,
    };
  }

  // Check if consecutive day
  const yesterday = new Date(activityDate);
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastActivity.toDateString() === yesterday.toDateString()) {
    // Streak continues!
    const newCount = currentCount + 1;
    const newLongest = Math.max(newCount, longestCount);

    // Check for milestone
    const milestoneReached = STREAK_MILESTONES.daily.find(m => m === newCount) || null;

    return {
      newCount,
      newLongest,
      isNewStreak: false,
      streakBroken: false,
      milestoneReached,
    };
  }

  // Streak broken - start new
  return {
    newCount: 1,
    newLongest: longestCount,
    isNewStreak: true,
    streakBroken: currentCount > 0,
    milestoneReached: null,
  };
};

// Get next milestone for a streak
export const getNextMilestone = (currentCount: number, type: StreakType): number | null => {
  const milestones = STREAK_MILESTONES[type];
  for (const milestone of milestones) {
    if (currentCount < milestone) return milestone;
  }
  return null;
};

// Get progress to next milestone
export const getMilestoneProgress = (currentCount: number, type: StreakType): {
  nextMilestone: number | null;
  progress: number;
  progressPercent: number;
} => {
  const nextMilestone = getNextMilestone(currentCount, type);

  if (!nextMilestone) {
    return {
      nextMilestone: null,
      progress: currentCount,
      progressPercent: 100,
    };
  }

  // Find previous milestone
  const milestones = STREAK_MILESTONES[type];
  const currentIndex = milestones.findIndex(m => m >= currentCount);
  const prevMilestone = currentIndex > 0 ? milestones[currentIndex - 1] : 0;

  const range = nextMilestone - prevMilestone;
  const progress = currentCount - prevMilestone;

  return {
    nextMilestone,
    progress,
    progressPercent: Math.round((progress / range) * 100),
  };
};

// Get streak display info
export const getStreakDisplayInfo = (
  currentCount: number,
  type: StreakType,
  lastActivityDate: string | null
): {
  count: number;
  displayText: string;
  emoji: string;
  isAtRisk: boolean;
  timeRemaining: string | null;
  nextMilestoneText: string | null;
} => {
  const atRisk = isStreakAtRisk(lastActivityDate);
  const timeUntilExpiry = getTimeUntilStreakExpiry(lastActivityDate);
  const milestoneInfo = getMilestoneProgress(currentCount, type);

  // Format time remaining
  let timeRemaining: string | null = null;
  if (timeUntilExpiry !== null) {
    const hours = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      timeRemaining = `${hours}h ${minutes}m`;
    } else {
      timeRemaining = `${minutes}m`;
    }
  }

  // Emoji based on streak length
  let emoji = '🔥';
  if (currentCount >= 100) emoji = '💎';
  else if (currentCount >= 30) emoji = '⭐';
  else if (currentCount >= 7) emoji = '🔥';
  else if (currentCount >= 3) emoji = '✨';

  const typeLabels = {
    daily: 'day',
    weekly: 'week',
    partner: 'meetup',
  };

  const displayText = `${currentCount} ${typeLabels[type]}${currentCount !== 1 ? 's' : ''} streak`;

  const nextMilestoneText = milestoneInfo.nextMilestone
    ? `${milestoneInfo.nextMilestone - currentCount} more to ${milestoneInfo.nextMilestone}!`
    : 'Max streak achieved!';

  return {
    count: currentCount,
    displayText,
    emoji,
    isAtRisk: atRisk,
    timeRemaining,
    nextMilestoneText,
  };
};

// Format streak at risk message
export const getStreakAtRiskMessage = (
  currentCount: number,
  timeUntilExpiry: number
): string => {
  const hours = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));

  const timeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minutes`;

  return `Your ${currentCount}-day streak ends in ${timeText}! Complete any activity to keep it alive.`;
};
