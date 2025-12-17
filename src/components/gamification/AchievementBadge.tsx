'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import {
  ACHIEVEMENTS,
  TIER_COLORS,
  getAchievementDisplayInfo,
  type AchievementTier,
} from '@/lib/gamification/achievements';

interface AchievementBadgeProps {
  achievementKey: string;
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
}

export function AchievementBadge({
  achievementKey,
  progress,
  size = 'md',
  showProgress = true,
  onClick,
}: AchievementBadgeProps) {
  const achievement = ACHIEVEMENTS[achievementKey];
  if (!achievement) return null;

  const displayInfo = getAchievementDisplayInfo(achievement, progress);
  const isLocked = displayInfo.tier === 'locked';

  const sizes = {
    sm: {
      container: 'w-16 h-16',
      emoji: 'text-2xl',
      tier: 'text-[8px] px-1.5 py-0.5',
      progress: 'text-[10px]',
    },
    md: {
      container: 'w-20 h-20',
      emoji: 'text-3xl',
      tier: 'text-[10px] px-2 py-0.5',
      progress: 'text-xs',
    },
    lg: {
      container: 'w-24 h-24',
      emoji: 'text-4xl',
      tier: 'text-xs px-2.5 py-1',
      progress: 'text-sm',
    },
  };

  const s = sizes[size];

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative ${s.container} rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all`}
      style={{
        background: isLocked ? '#252529' : `linear-gradient(135deg, ${displayInfo.tierColor}20 0%, #1A1A1E 100%)`,
        border: `2px solid ${isLocked ? '#3A3A3E' : displayInfo.tierColor}40`,
      }}
    >
      {/* Glow effect for unlocked badges */}
      {!isLocked && (
        <div
          className="absolute inset-0 rounded-xl opacity-20 blur-lg"
          style={{ background: displayInfo.tierColor }}
        />
      )}

      {/* Badge content */}
      <div className="relative z-10 flex flex-col items-center">
        {isLocked ? (
          <Lock className="w-6 h-6 text-text-muted" />
        ) : (
          <span className={s.emoji}>{displayInfo.emoji}</span>
        )}

        {/* Tier indicator */}
        {!isLocked && (
          <span
            className={`${s.tier} rounded-full font-bold uppercase mt-1`}
            style={{
              background: displayInfo.tierColor,
              color: '#1A1A1E',
            }}
          >
            {displayInfo.tier}
          </span>
        )}
      </div>

      {/* Progress indicator */}
      {showProgress && !isLocked && (
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${s.progress} text-text-muted whitespace-nowrap`}>
          {displayInfo.progressDisplay}
        </div>
      )}
    </motion.div>
  );
}

// Achievement card with full details
interface AchievementCardProps {
  achievementKey: string;
  progress: number;
  className?: string;
}

export function AchievementCard({ achievementKey, progress, className = '' }: AchievementCardProps) {
  const achievement = ACHIEVEMENTS[achievementKey];
  if (!achievement) return null;

  const displayInfo = getAchievementDisplayInfo(achievement, progress);
  const isLocked = displayInfo.tier === 'locked';

  // Calculate progress bar width
  const progressPercent = displayInfo.nextMilestone
    ? Math.min(100, (progress / displayInfo.nextMilestone) * 100)
    : 100;

  return (
    <div
      className={`card-dark p-4 ${className}`}
      style={{
        borderLeft: `3px solid ${isLocked ? '#3A3A3E' : displayInfo.tierColor}`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Badge */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: isLocked ? '#252529' : `${displayInfo.tierColor}20`,
          }}
        >
          {isLocked ? (
            <Lock className="w-6 h-6 text-text-muted" />
          ) : (
            <span className="text-3xl">{displayInfo.emoji}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-text-primary">{displayInfo.name}</h4>
            {!isLocked && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                style={{
                  background: displayInfo.tierColor,
                  color: '#1A1A1E',
                }}
              >
                {displayInfo.tier}
              </span>
            )}
          </div>

          <p className="text-sm text-text-muted mb-2">{displayInfo.description}</p>

          {/* Progress bar */}
          <div className="relative">
            <div className="w-full h-2 rounded-full bg-dark-surface overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: isLocked ? '#3A3A3E' : displayInfo.tierColor }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-text-muted">
              <span>{displayInfo.progressDisplay}</span>
              {displayInfo.nextMilestone && (
                <span>{displayInfo.nextMilestone - progress} more to next tier</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Collection grid
interface BadgeCollectionProps {
  achievements: { key: string; progress: number }[];
  showLocked?: boolean;
  className?: string;
}

export function BadgeCollection({ achievements, showLocked = true, className = '' }: BadgeCollectionProps) {
  // Get all achievement keys
  const allKeys = Object.keys(ACHIEVEMENTS);

  // Create a map of progress
  const progressMap = new Map(achievements.map((a) => [a.key, a.progress]));

  // Filter achievements to show
  const displayAchievements = allKeys
    .map((key) => ({
      key,
      progress: progressMap.get(key) || 0,
    }))
    .filter((a) => {
      if (showLocked) return true;
      const info = getAchievementDisplayInfo(ACHIEVEMENTS[a.key], a.progress);
      return info.tier !== 'locked';
    });

  // Separate unlocked and locked
  const unlocked = displayAchievements.filter((a) => {
    const info = getAchievementDisplayInfo(ACHIEVEMENTS[a.key], a.progress);
    return info.tier !== 'locked';
  });
  const locked = displayAchievements.filter((a) => {
    const info = getAchievementDisplayInfo(ACHIEVEMENTS[a.key], a.progress);
    return info.tier === 'locked';
  });

  return (
    <div className={className}>
      {unlocked.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
            Unlocked ({unlocked.length})
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {unlocked.map((a) => (
              <AchievementBadge key={a.key} achievementKey={a.key} progress={a.progress} size="md" />
            ))}
          </div>
        </div>
      )}

      {showLocked && locked.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
            Locked ({locked.length})
          </h3>
          <div className="grid grid-cols-4 gap-3 opacity-60">
            {locked.map((a) => (
              <AchievementBadge key={a.key} achievementKey={a.key} progress={a.progress} size="md" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
