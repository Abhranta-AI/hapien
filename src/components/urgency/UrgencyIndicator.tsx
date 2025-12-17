'use client';

import { motion } from 'framer-motion';
import { Clock, Users, Zap, AlertTriangle } from 'lucide-react';

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NORMAL';

interface UrgencyIndicatorProps {
  spotsLeft?: number;
  maxSpots?: number;
  minutesUntilStart?: number;
  watchersCount?: number;
  className?: string;
}

// Determine urgency level based on spots and time
export const getUrgencyLevel = (
  spotsLeft?: number,
  minutesUntilStart?: number
): UrgencyLevel => {
  if (spotsLeft === 1) return 'CRITICAL';
  if (minutesUntilStart !== undefined && minutesUntilStart <= 15) return 'HIGH';
  if (spotsLeft !== undefined && spotsLeft <= 2) return 'MEDIUM';
  return 'NORMAL';
};

const urgencyConfig = {
  CRITICAL: {
    color: '#FF3366',
    bgColor: '#FF336620',
    borderColor: '#FF336640',
    label: 'LAST SPOT!',
    icon: AlertTriangle,
    pulse: true,
  },
  HIGH: {
    color: '#FF8C00',
    bgColor: '#FF8C0020',
    borderColor: '#FF8C0040',
    label: 'Starting soon!',
    icon: Clock,
    pulse: true,
  },
  MEDIUM: {
    color: '#FFB800',
    bgColor: '#FFB80020',
    borderColor: '#FFB80040',
    label: 'spots left',
    icon: Users,
    pulse: false,
  },
  NORMAL: {
    color: '#9999A5',
    bgColor: '#9999A520',
    borderColor: '#9999A540',
    label: 'Open',
    icon: Users,
    pulse: false,
  },
};

export function UrgencyIndicator({
  spotsLeft,
  maxSpots,
  minutesUntilStart,
  watchersCount,
  className = '',
}: UrgencyIndicatorProps) {
  const urgencyLevel = getUrgencyLevel(spotsLeft, minutesUntilStart);
  const config = urgencyConfig[urgencyLevel];
  const Icon = config.icon;

  // Format label
  let label = config.label;
  if (urgencyLevel === 'MEDIUM' && spotsLeft !== undefined) {
    label = `${spotsLeft} ${config.label}`;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Main urgency badge */}
      <motion.div
        animate={config.pulse ? { scale: [1, 1.02, 1] } : undefined}
        transition={config.pulse ? { duration: 1, repeat: Infinity } : undefined}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
        style={{
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          color: config.color,
        }}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        {minutesUntilStart !== undefined && urgencyLevel !== 'NORMAL' && (
          <>
            <span className="opacity-60">·</span>
            <span>{minutesUntilStart} min</span>
          </>
        )}
      </motion.div>

      {/* Spots progress bar */}
      {spotsLeft !== undefined && maxSpots !== undefined && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-dark-surface overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: config.color }}
              initial={{ width: 0 }}
              animate={{ width: `${((maxSpots - spotsLeft) / maxSpots) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-text-muted">
            {maxSpots - spotsLeft}/{maxSpots}
          </span>
        </div>
      )}

      {/* Live watchers indicator */}
      {watchersCount !== undefined && watchersCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Zap className="w-3 h-3 text-gold-500" />
          <span>{watchersCount} people looking at this right now</span>
        </div>
      )}
    </div>
  );
}

// Compact urgency badge for cards
interface UrgencyBadgeProps {
  spotsLeft?: number;
  minutesUntilStart?: number;
  className?: string;
}

export function UrgencyBadge({ spotsLeft, minutesUntilStart, className = '' }: UrgencyBadgeProps) {
  const urgencyLevel = getUrgencyLevel(spotsLeft, minutesUntilStart);
  const config = urgencyConfig[urgencyLevel];

  if (urgencyLevel === 'NORMAL') return null;

  return (
    <motion.span
      animate={config.pulse ? { opacity: [1, 0.7, 1] } : undefined}
      transition={config.pulse ? { duration: 1, repeat: Infinity } : undefined}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{
        background: config.color,
        color: '#1A1A1E',
      }}
    >
      {urgencyLevel === 'CRITICAL' ? (
        'LAST SPOT!'
      ) : urgencyLevel === 'HIGH' ? (
        <>
          <Clock className="w-3 h-3" />
          {minutesUntilStart}m
        </>
      ) : (
        `${spotsLeft} left`
      )}
    </motion.span>
  );
}

// Happy hour banner
interface HappyHourBannerProps {
  endTime: Date;
  multiplier: number;
  className?: string;
}

export function HappyHourBanner({ endTime, multiplier, className = '' }: HappyHourBannerProps) {
  const now = new Date();
  const remainingMs = endTime.getTime() - now.getTime();
  const remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  const timeDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`rounded-xl p-4 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #FFB80020 0%, #FF8C0020 100%)',
        border: '1px solid #FFB80040',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            className="text-3xl"
          >
            ⚡
          </motion.div>
          <div>
            <h3 className="font-bold text-gold-500">HAPPY HOUR BONUS</h3>
            <p className="text-sm text-text-muted">
              Complete any hangout for{' '}
              <span className="font-bold text-gold-500">{multiplier}x XP</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Ends in</p>
          <p className="text-lg font-bold text-gold-500">{timeDisplay}</p>
        </div>
      </div>
    </motion.div>
  );
}
