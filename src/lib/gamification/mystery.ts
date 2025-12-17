/**
 * Mystery System - Core Drive 7: Unpredictability & Curiosity
 *
 * Random rewards and mystery elements keep users engaged
 * because they don't know what's coming next.
 */

// Mystery event types
export type MysteryEventType =
  | 'XP_MULTIPLIER'
  | 'BONUS_DROP'
  | 'MYSTERY_BADGE'
  | 'LUCKY_STREAK'
  | 'HIDDEN_ACHIEVEMENT';

// XP Multiplier event - random chance after hangout completion
export interface XPMultiplierEvent {
  type: 'XP_MULTIPLIER';
  multiplier: 1.5 | 2 | 3;
  message: string;
}

// Bonus drop event - triggered at milestones with variance
export interface BonusDropEvent {
  type: 'BONUS_DROP';
  xpAmount: number;
  message: string;
  milestone: string;
}

// Mystery event configuration
export const MYSTERY_CONFIG = {
  // Random XP multiplier after completing a hangout
  XP_MULTIPLIER: {
    probability: 0.1, // 10% chance
    multipliers: [1.5, 2, 3] as const,
    weights: [70, 25, 5], // 70% for 1.5x, 25% for 2x, 5% for 3x
  },

  // Bonus drops at milestone hangouts
  BONUS_DROP: {
    baseTriggers: [10, 25, 50, 100, 200, 500, 1000],
    variancePercent: 10, // ±10% variance so exact milestone is unpredictable
    rewards: {
      10: { min: 100, max: 150 },
      25: { min: 200, max: 300 },
      50: { min: 400, max: 600 },
      100: { min: 800, max: 1200 },
      200: { min: 1500, max: 2000 },
      500: { min: 3000, max: 4000 },
      1000: { min: 5000, max: 7500 },
    } as Record<number, { min: number; max: number }>,
  },

  // Happy hour windows (Core Drive 6: Scarcity)
  HAPPY_HOUR: {
    durationMinutes: 120,
    probability: 0.1, // 10% chance to trigger each hour
    multiplier: 2,
    peakHours: [17, 18, 19, 20], // 5PM-8PM more likely
    peakProbability: 0.25,
  },
} as const;

// Check if XP multiplier triggers
export const rollForXPMultiplier = (): XPMultiplierEvent | null => {
  const roll = Math.random();
  if (roll > MYSTERY_CONFIG.XP_MULTIPLIER.probability) {
    return null;
  }

  // Weighted random selection for multiplier
  const { multipliers, weights } = MYSTERY_CONFIG.XP_MULTIPLIER;
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let randomWeight = Math.random() * totalWeight;

  for (let i = 0; i < multipliers.length; i++) {
    randomWeight -= weights[i];
    if (randomWeight <= 0) {
      const multiplier = multipliers[i];
      return {
        type: 'XP_MULTIPLIER',
        multiplier,
        message: getMultiplierMessage(multiplier),
      };
    }
  }

  return {
    type: 'XP_MULTIPLIER',
    multiplier: 1.5,
    message: getMultiplierMessage(1.5),
  };
};

// Get message for multiplier
const getMultiplierMessage = (multiplier: 1.5 | 2 | 3): string => {
  const messages = {
    1.5: ['Nice! 1.5x XP bonus!', 'Lucky you! 1.5x XP!', 'Bonus time! 1.5x XP!'],
    2: ['Wow! 2x XP multiplier!', 'Double XP! You're on fire!', '2x XP - Keep it going!'],
    3: ['JACKPOT! 3x XP!!!', 'LEGENDARY! Triple XP!', '3x XP - Incredibly lucky!'],
  };
  const options = messages[multiplier];
  return options[Math.floor(Math.random() * options.length)];
};

// Check if bonus drop triggers
export const checkForBonusDrop = (totalHangouts: number): BonusDropEvent | null => {
  const { baseTriggers, variancePercent, rewards } = MYSTERY_CONFIG.BONUS_DROP;

  for (const trigger of baseTriggers) {
    // Add variance to make exact trigger unpredictable
    const variance = trigger * (variancePercent / 100);
    const actualTrigger = trigger + Math.floor((Math.random() - 0.5) * 2 * variance);

    if (totalHangouts === actualTrigger) {
      const reward = rewards[trigger];
      const xpAmount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;

      return {
        type: 'BONUS_DROP',
        xpAmount,
        message: getBonusDropMessage(trigger, xpAmount),
        milestone: `${trigger} Hangouts`,
      };
    }
  }

  return null;
};

// Get message for bonus drop
const getBonusDropMessage = (milestone: number, xp: number): string => {
  const messages = [
    `${milestone} hangouts milestone! +${xp} XP bonus!`,
    `You reached ${milestone} hangouts! Here's ${xp} bonus XP!`,
    `Milestone unlocked: ${milestone} hangouts! Enjoy ${xp} XP!`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Check if happy hour is active
export const isHappyHourActive = (): boolean => {
  // In a real implementation, this would check a server-side flag
  // For now, we'll use time-based logic
  const now = new Date();
  const hour = now.getHours();

  // More likely during peak hours
  const isPeakHour = MYSTERY_CONFIG.HAPPY_HOUR.peakHours.includes(hour);
  const probability = isPeakHour
    ? MYSTERY_CONFIG.HAPPY_HOUR.peakProbability
    : MYSTERY_CONFIG.HAPPY_HOUR.probability;

  // This is a simplified version - real implementation would use server state
  // to ensure all users see the same happy hour
  return Math.random() < probability;
};

// Mystery teasers for "coming soon" elements
export interface MysteryTeaser {
  type: 'next_milestone' | 'hidden_badge' | 'special_event';
  title: string;
  hint: string;
  progress?: number;
  progressMax?: number;
}

// Generate mystery teaser based on user progress
export const generateMysteryTeaser = (
  totalHangouts: number,
  totalPeopleMet: number,
  currentLevel: number
): MysteryTeaser | null => {
  const teasers: MysteryTeaser[] = [];

  // Next milestone teaser
  const nextMilestone = MYSTERY_CONFIG.BONUS_DROP.baseTriggers.find(t => t > totalHangouts);
  if (nextMilestone) {
    const remaining = nextMilestone - totalHangouts;
    if (remaining <= 5) {
      teasers.push({
        type: 'next_milestone',
        title: '??? Something special awaits...',
        hint: `${remaining} more hangout${remaining !== 1 ? 's' : ''} to find out!`,
        progress: totalHangouts,
        progressMax: nextMilestone,
      });
    }
  }

  // Hidden badge teaser (example: "Social Butterfly" at 50 unique people)
  if (totalPeopleMet >= 45 && totalPeopleMet < 50) {
    teasers.push({
      type: 'hidden_badge',
      title: '🦋 A rare badge is within reach...',
      hint: `${50 - totalPeopleMet} more new faces to discover it!`,
      progress: totalPeopleMet,
      progressMax: 50,
    });
  }

  // Level unlock teaser
  const nextUnlockLevel = [5, 10, 15, 20].find(l => l > currentLevel);
  if (nextUnlockLevel && nextUnlockLevel - currentLevel <= 2) {
    teasers.push({
      type: 'special_event',
      title: '🔓 A new feature awaits...',
      hint: `Reach level ${nextUnlockLevel} to unlock!`,
    });
  }

  // Return random teaser or null
  if (teasers.length === 0) return null;
  return teasers[Math.floor(Math.random() * teasers.length)];
};

// Weekly mystery challenge
export interface MysteryChallenge {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  rewardXP: number; // Revealed as "???" until completed
  category: 'time' | 'social' | 'activity' | 'streak';
}

// Generate weekly mystery challenges
export const generateWeeklyChallenge = (): MysteryChallenge => {
  const challenges: MysteryChallenge[] = [
    {
      id: 'early_bird_week',
      title: 'Mystery Morning Challenge',
      description: 'Complete a hangout before 7 AM this week',
      targetCount: 1,
      rewardXP: 150,
      category: 'time',
    },
    {
      id: 'social_sprint',
      title: 'Mystery Social Sprint',
      description: 'Meet 3 new people this week',
      targetCount: 3,
      rewardXP: 200,
      category: 'social',
    },
    {
      id: 'variety_pack',
      title: 'Mystery Variety Pack',
      description: 'Try 3 different activity types this week',
      targetCount: 3,
      rewardXP: 175,
      category: 'activity',
    },
    {
      id: 'streak_keeper',
      title: 'Mystery Streak Keeper',
      description: 'Maintain your streak for the entire week',
      targetCount: 7,
      rewardXP: 250,
      category: 'streak',
    },
    {
      id: 'weekend_warrior',
      title: 'Mystery Weekend Warrior',
      description: 'Complete 3 hangouts over the weekend',
      targetCount: 3,
      rewardXP: 175,
      category: 'time',
    },
  ];

  return challenges[Math.floor(Math.random() * challenges.length)];
};

// Reveal animation types
export type RevealAnimationType = 'flip' | 'unwrap' | 'sparkle' | 'explosion';

// Get reveal animation based on reward size
export const getRevealAnimation = (xpAmount: number): RevealAnimationType => {
  if (xpAmount >= 500) return 'explosion';
  if (xpAmount >= 200) return 'sparkle';
  if (xpAmount >= 100) return 'unwrap';
  return 'flip';
};
