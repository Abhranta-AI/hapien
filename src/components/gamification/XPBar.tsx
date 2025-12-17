'use client';

import { motion } from 'framer-motion';
import { Flame, TrendingUp } from 'lucide-react';
import { getLevelProgressInfo, getLevelTitle } from '@/lib/gamification/levels';
import { formatXP } from '@/lib/gamification/xp';

interface XPBarProps {
  currentXP: number;
  variant?: 'full' | 'compact' | 'mini';
  showStreak?: boolean;
  streakDays?: number;
  className?: string;
}

export function XPBar({
  currentXP,
  variant = 'full',
  showStreak = false,
  streakDays = 0,
  className = '',
}: XPBarProps) {
  const progress = getLevelProgressInfo(currentXP);

  if (variant === 'mini') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF8C00 100%)', color: '#1A1A1E' }}
        >
          <Flame className="w-3 h-3" />
          <span>{formatXP(currentXP)} XP</span>
        </div>
        {showStreak && streakDays > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-dark-surface text-coral-500">
            <span>🔥</span>
            <span>{streakDays}</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gold-500">Lvl {progress.currentLevel}</span>
          <div className="w-24 h-2 rounded-full bg-dark-surface overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #FFB800 0%, #FF8C00 100%)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress.progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
        <span className="text-xs text-text-muted">{formatXP(progress.xpNeeded)} to go</span>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`card-dark p-4 ${className}`}>
      {/* Level and Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF8C00 100%)', color: '#1A1A1E' }}
          >
            {progress.currentLevel}
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">{progress.title}</p>
            <p className="text-sm text-text-muted">Level {progress.currentLevel}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-gold-500">
            <Flame className="w-5 h-5" />
            <span className="text-xl font-bold">{formatXP(currentXP)}</span>
            <span className="text-sm">XP</span>
          </div>
          {showStreak && streakDays > 0 && (
            <div className="flex items-center gap-1 text-coral-500 mt-1">
              <span>🔥</span>
              <span className="text-sm font-medium">{streakDays} day streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-3 rounded-full bg-dark-surface overflow-hidden">
          <motion.div
            className="h-full rounded-full relative"
            style={{ background: 'linear-gradient(90deg, #FFB800 0%, #FF8C00 100%)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress.progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
                animation: 'shimmer 2s infinite',
              }}
            />
          </motion.div>
        </div>

        {/* Progress text */}
        <div className="flex justify-between mt-2 text-xs text-text-muted">
          <span>{formatXP(progress.xpProgress)} XP in this level</span>
          <span>{formatXP(progress.xpNeeded)} XP to Level {progress.currentLevel + 1}</span>
        </div>
      </div>

      {/* Next Unlock Preview */}
      {progress.nextUnlock && (
        <div className="mt-4 pt-3 border-t border-dark-border">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-jade-500" />
            <span className="text-text-muted">Next unlock at Level {progress.nextUnlock.level}:</span>
            <span className="text-text-primary font-medium">
              {progress.nextUnlock.icon} {progress.nextUnlock.description}
            </span>
          </div>
        </div>
      )}

      {/* CSS for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

// Quick stats row component
interface QuickStatsProps {
  meetups: number;
  newFaces: number;
  streak: number;
  className?: string;
}

export function QuickStats({ meetups, newFaces, streak, className = '' }: QuickStatsProps) {
  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      <div className="text-center">
        <p className="text-2xl font-bold text-text-primary">{meetups}</p>
        <p className="text-xs text-text-muted">Meetups</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-text-primary">{newFaces}</p>
        <p className="text-xs text-text-muted">New Faces</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-coral-500 flex items-center justify-center gap-1">
          🔥 {streak}
        </p>
        <p className="text-xs text-text-muted">Day Streak</p>
      </div>
    </div>
  );
}
