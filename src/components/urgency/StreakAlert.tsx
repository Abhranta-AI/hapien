'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, X, ChevronRight, Coffee, PersonStanding } from 'lucide-react';
import { getStreakDisplayInfo, getStreakAtRiskMessage, getTimeUntilStreakExpiry } from '@/lib/gamification/streaks';

interface StreakAtRiskAlertProps {
  currentStreak: number;
  lastActivityDate: string;
  onDismiss?: () => void;
  onFindActivity?: () => void;
  className?: string;
}

export function StreakAtRiskAlert({
  currentStreak,
  lastActivityDate,
  onDismiss,
  onFindActivity,
  className = '',
}: StreakAtRiskAlertProps) {
  const timeUntilExpiry = getTimeUntilStreakExpiry(lastActivityDate);

  if (!timeUntilExpiry || timeUntilExpiry <= 0) return null;

  const message = getStreakAtRiskMessage(currentStreak, timeUntilExpiry);
  const hours = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl p-4 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #FF336620 0%, #1A1A1E 100%)',
        border: '1px solid #FF336640',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Flame className="w-6 h-6 text-coral-500" />
          </motion.div>
          <div>
            <h3 className="font-bold text-text-primary">Your streak is at risk!</h3>
            <p className="text-sm text-text-muted">{currentStreak} day streak</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-dark-surface transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        )}
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2 mb-4 text-urgent-500">
        <Clock className="w-4 h-4" />
        <span className="font-mono font-bold text-lg">
          {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
        </span>
        <span className="text-sm text-text-muted">until midnight</span>
      </div>

      {/* Quick options */}
      <div className="mb-4">
        <p className="text-sm text-text-muted mb-2">Quick options:</p>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-surface text-text-secondary text-sm hover:bg-dark-elevated transition-colors">
            <Coffee className="w-4 h-4" />
            Coffee run
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-surface text-text-secondary text-sm hover:bg-dark-elevated transition-colors">
            <PersonStanding className="w-4 h-4" />
            Quick walk
          </button>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onFindActivity}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all"
        style={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF3366 100%)',
          color: 'white',
        }}
      >
        Find an activity now
        <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// Compact streak display
interface StreakDisplayProps {
  currentStreak: number;
  lastActivityDate: string | null;
  size?: 'sm' | 'md' | 'lg';
  showRisk?: boolean;
  className?: string;
}

export function StreakDisplay({
  currentStreak,
  lastActivityDate,
  size = 'md',
  showRisk = true,
  className = '',
}: StreakDisplayProps) {
  const info = getStreakDisplayInfo(currentStreak, 'daily', lastActivityDate);

  const sizes = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  const emojiSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-center gap-2 rounded-full font-bold ${sizes[size]}`}
        style={{
          background: info.isAtRisk ? '#FF336620' : '#FF6B3520',
          color: info.isAtRisk ? '#FF3366' : '#FF6B35',
          border: `1px solid ${info.isAtRisk ? '#FF336640' : '#FF6B3540'}`,
        }}
      >
        <motion.span
          animate={info.isAtRisk ? { scale: [1, 1.2, 1] } : undefined}
          transition={{ duration: 0.5, repeat: Infinity }}
          className={emojiSizes[size]}
        >
          {info.emoji}
        </motion.span>
        <span>{info.count}</span>
      </div>

      {showRisk && info.isAtRisk && info.timeRemaining && (
        <span className="text-xs text-urgent-500 font-medium">
          Expires in {info.timeRemaining}
        </span>
      )}
    </div>
  );
}

// "You missed out" alert
interface MissedActivityAlertProps {
  activityType: string;
  activityEmoji: string;
  participants: string[];
  when: string;
  onSetAlert?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function MissedActivityAlert({
  activityType,
  activityEmoji,
  participants,
  when,
  onSetAlert,
  onDismiss,
  className = '',
}: MissedActivityAlertProps) {
  const participantText =
    participants.length === 1
      ? participants[0]
      : participants.length === 2
        ? `${participants[0]} and ${participants[1]}`
        : `${participants[0]}, ${participants[1]}, and ${participants.length - 2} others`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card-dark p-4 ${className}`}
      style={{
        borderLeft: '3px solid #FF6B35',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{activityEmoji}</span>
          <span className="font-semibold text-text-primary">You missed out</span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-text-secondary mb-3">
        {participantText} had {activityType} {when}.
      </p>

      <p className="text-sm text-text-muted mb-3">Don't miss the next one!</p>

      <button
        onClick={onSetAlert}
        className="w-full py-2 rounded-lg text-sm font-medium bg-dark-surface text-coral-500 hover:bg-dark-elevated transition-colors"
      >
        Set alert for {activityType}
      </button>
    </motion.div>
  );
}

// Friendship cooling alert
interface FriendshipCoolingAlertProps {
  friendName: string;
  friendAvatar?: string;
  daysSinceLastMeetup: number;
  connectionStrength: number; // 0-100
  onPlanHangout?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function FriendshipCoolingAlert({
  friendName,
  daysSinceLastMeetup,
  connectionStrength,
  onPlanHangout,
  onDismiss,
  className = '',
}: FriendshipCoolingAlertProps) {
  const strengthColor =
    connectionStrength > 70
      ? '#00D9A5'
      : connectionStrength > 40
        ? '#FFB800'
        : '#FF3366';

  const statusText =
    connectionStrength > 70 ? 'Strong' : connectionStrength > 40 ? 'Cooling' : 'At risk';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-dark p-4 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-gold-500">
          <span>⚠️</span>
          <span className="font-semibold">Friendship cooling</span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-text-secondary mb-3">
        You haven't met <span className="text-text-primary font-medium">{friendName}</span> in{' '}
        <span className="text-gold-500 font-medium">{daysSinceLastMeetup} days</span>!
      </p>

      {/* Connection strength bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-muted">Connection strength</span>
          <span style={{ color: strengthColor }}>{statusText}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-dark-surface overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: strengthColor }}
            initial={{ width: 0 }}
            animate={{ width: `${connectionStrength}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <button
        onClick={onPlanHangout}
        className="w-full py-2 rounded-lg text-sm font-medium bg-dark-surface text-jade-500 hover:bg-dark-elevated transition-colors"
      >
        Plan with {friendName}
      </button>
    </motion.div>
  );
}
