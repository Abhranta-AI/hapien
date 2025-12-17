/**
 * XP System - Core Drive 2: Development & Accomplishment
 *
 * Every IRL meetup earns XP, driving the dopamine loop that builds tribes.
 */

// XP amounts for various events
export const XP_EVENTS = {
  // Activity Participation
  JOIN_HANGOUT: 25,
  COMPLETE_HANGOUT: 50,
  CREATE_HANGOUT: 35,
  FIRST_HANGOUT_OF_DAY: 20,

  // Social Growth - The tribe building multiplier!
  MEET_NEW_PERSON: 100,
  REPEAT_MEETUP_SAME_PERSON: 75,
  REACH_CLOSE_FRIEND_STATUS: 200, // 5+ meetups with same person

  // Activity-specific bonuses
  SPORTS_ACTIVITY: 10,  // Bonus for physical activities
  EARLY_BIRD: 15,       // Activities before 8 AM
  NIGHT_OWL: 15,        // Activities after 9 PM
} as const;

// Streak bonus calculation
export const calculateStreakBonus = (days: number): number => {
  // Daily streak gives 10 XP per day, capped at 100
  return Math.min(days * 10, 100);
};

// Weekly streak bonus
export const calculateWeeklyStreakBonus = (weeks: number): number => {
  return weeks * 50;
};

// Activity milestone bonus (10, 25, 50, 100 completions)
export const calculateActivityMilestoneBonus = (count: number): number => {
  if (count === 10) return 100;
  if (count === 25) return 250;
  if (count === 50) return 500;
  if (count === 100) return 1000;
  return 0;
};

// XP event types for transactions
export type XPEventType =
  | 'JOIN_HANGOUT'
  | 'COMPLETE_HANGOUT'
  | 'CREATE_HANGOUT'
  | 'FIRST_HANGOUT_OF_DAY'
  | 'MEET_NEW_PERSON'
  | 'REPEAT_MEETUP_SAME_PERSON'
  | 'REACH_CLOSE_FRIEND_STATUS'
  | 'DAILY_STREAK_BONUS'
  | 'WEEKLY_STREAK_BONUS'
  | 'ACTIVITY_MILESTONE'
  | 'SPORTS_BONUS'
  | 'EARLY_BIRD_BONUS'
  | 'NIGHT_OWL_BONUS'
  | 'MYSTERY_BONUS'
  | 'HAPPY_HOUR_MULTIPLIER';

// Calculate XP for completing a hangout with all bonuses
export interface HangoutCompletionContext {
  isFirstHangoutOfDay: boolean;
  isNewPerson: boolean;
  isRepeatMeetup: boolean;
  reachedCloseFriendStatus: boolean;
  hangoutCategory: string;
  hangoutTime: Date;
  currentStreak: number;
  activityCount: number;
  isHappyHour?: boolean;
}

export const calculateHangoutCompletionXP = (context: HangoutCompletionContext): {
  baseXP: number;
  bonuses: { type: XPEventType; amount: number }[];
  totalXP: number;
  multiplier: number;
} => {
  const bonuses: { type: XPEventType; amount: number }[] = [];
  let baseXP = XP_EVENTS.COMPLETE_HANGOUT;

  // First hangout of the day bonus
  if (context.isFirstHangoutOfDay) {
    bonuses.push({ type: 'FIRST_HANGOUT_OF_DAY', amount: XP_EVENTS.FIRST_HANGOUT_OF_DAY });
  }

  // Social growth bonuses
  if (context.isNewPerson) {
    bonuses.push({ type: 'MEET_NEW_PERSON', amount: XP_EVENTS.MEET_NEW_PERSON });
  } else if (context.isRepeatMeetup) {
    bonuses.push({ type: 'REPEAT_MEETUP_SAME_PERSON', amount: XP_EVENTS.REPEAT_MEETUP_SAME_PERSON });
  }

  if (context.reachedCloseFriendStatus) {
    bonuses.push({ type: 'REACH_CLOSE_FRIEND_STATUS', amount: XP_EVENTS.REACH_CLOSE_FRIEND_STATUS });
  }

  // Activity type bonus
  if (context.hangoutCategory === 'sports') {
    bonuses.push({ type: 'SPORTS_BONUS', amount: XP_EVENTS.SPORTS_ACTIVITY });
  }

  // Time-based bonuses
  const hour = context.hangoutTime.getHours();
  if (hour < 8) {
    bonuses.push({ type: 'EARLY_BIRD_BONUS', amount: XP_EVENTS.EARLY_BIRD });
  } else if (hour >= 21) {
    bonuses.push({ type: 'NIGHT_OWL_BONUS', amount: XP_EVENTS.NIGHT_OWL });
  }

  // Streak bonus
  if (context.currentStreak > 0) {
    const streakBonus = calculateStreakBonus(context.currentStreak);
    bonuses.push({ type: 'DAILY_STREAK_BONUS', amount: streakBonus });
  }

  // Activity milestone bonus
  const milestoneBonus = calculateActivityMilestoneBonus(context.activityCount);
  if (milestoneBonus > 0) {
    bonuses.push({ type: 'ACTIVITY_MILESTONE', amount: milestoneBonus });
  }

  // Calculate total before multiplier
  const subtotal = baseXP + bonuses.reduce((sum, b) => sum + b.amount, 0);

  // Happy hour multiplier (Core Drive 6: Scarcity)
  const multiplier = context.isHappyHour ? 2 : 1;
  const totalXP = subtotal * multiplier;

  return {
    baseXP,
    bonuses,
    totalXP,
    multiplier,
  };
};

// Format XP for display
export const formatXP = (xp: number): string => {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`;
  }
  return xp.toString();
};

// Calculate XP needed to reach next level
export const calculateXPToNextLevel = (currentXP: number, currentLevel: number, levelThresholds: number[]): number => {
  if (currentLevel >= levelThresholds.length - 1) {
    return 0; // Max level reached
  }
  return levelThresholds[currentLevel] - currentXP;
};

// Calculate progress percentage to next level
export const calculateLevelProgress = (currentXP: number, currentLevel: number, levelThresholds: number[]): number => {
  if (currentLevel >= levelThresholds.length - 1) {
    return 100; // Max level
  }

  const currentLevelThreshold = levelThresholds[currentLevel - 1] || 0;
  const nextLevelThreshold = levelThresholds[currentLevel];
  const xpInCurrentLevel = currentXP - currentLevelThreshold;
  const xpNeededForLevel = nextLevelThreshold - currentLevelThreshold;

  return Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));
};
