'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetTime: Date;
  onComplete?: () => void;
  variant?: 'full' | 'compact' | 'minimal';
  showIcon?: boolean;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const calculateTimeLeft = (targetTime: Date): TimeLeft => {
  const difference = targetTime.getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
};

export function CountdownTimer({
  targetTime,
  onComplete,
  variant = 'full',
  showIcon = true,
  className = '',
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetTime));
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetTime);
      setTimeLeft(newTimeLeft);

      // Check if urgent (less than 5 minutes)
      setIsUrgent(newTimeLeft.total > 0 && newTimeLeft.total < 5 * 60 * 1000);

      // Check if complete
      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime, onComplete]);

  // Color based on urgency
  const color = isUrgent ? '#FF3366' : timeLeft.total < 15 * 60 * 1000 ? '#FF8C00' : '#FFB800';

  if (variant === 'minimal') {
    const display =
      timeLeft.days > 0
        ? `${timeLeft.days}d ${timeLeft.hours}h`
        : timeLeft.hours > 0
          ? `${timeLeft.hours}h ${timeLeft.minutes}m`
          : `${timeLeft.minutes}m ${timeLeft.seconds}s`;

    return (
      <motion.span
        animate={isUrgent ? { scale: [1, 1.05, 1] } : undefined}
        transition={isUrgent ? { duration: 0.5, repeat: Infinity } : undefined}
        className={`inline-flex items-center gap-1 text-sm font-mono font-bold ${className}`}
        style={{ color }}
      >
        {showIcon && <Clock className="w-4 h-4" />}
        {display}
      </motion.span>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        animate={isUrgent ? { scale: [1, 1.02, 1] } : undefined}
        transition={isUrgent ? { duration: 0.5, repeat: Infinity } : undefined}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${className}`}
        style={{
          background: `${color}20`,
          border: `1px solid ${color}40`,
        }}
      >
        {showIcon && <Clock className="w-4 h-4" style={{ color }} />}
        <span className="font-mono font-bold" style={{ color }}>
          {timeLeft.hours > 0 && `${String(timeLeft.hours).padStart(2, '0')}:`}
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      animate={isUrgent ? { borderColor: [color, `${color}60`, color] } : undefined}
      transition={isUrgent ? { duration: 1, repeat: Infinity } : undefined}
      className={`flex items-center justify-center gap-4 p-4 rounded-xl ${className}`}
      style={{
        background: `${color}10`,
        border: `2px solid ${color}40`,
      }}
    >
      {/* Days */}
      {timeLeft.days > 0 && (
        <TimeUnit value={timeLeft.days} label="Days" color={color} isUrgent={isUrgent} />
      )}

      {/* Hours */}
      {(timeLeft.days > 0 || timeLeft.hours > 0) && (
        <TimeUnit value={timeLeft.hours} label="Hours" color={color} isUrgent={isUrgent} />
      )}

      {/* Minutes */}
      <TimeUnit value={timeLeft.minutes} label="Mins" color={color} isUrgent={isUrgent} />

      {/* Seconds */}
      <TimeUnit value={timeLeft.seconds} label="Secs" color={color} isUrgent={isUrgent} />
    </motion.div>
  );
}

// Individual time unit display
interface TimeUnitProps {
  value: number;
  label: string;
  color: string;
  isUrgent: boolean;
}

function TimeUnit({ value, label, color, isUrgent }: TimeUnitProps) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-mono font-bold"
        style={{ color }}
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
    </div>
  );
}

// Relative time display (e.g., "in 15 min", "starting now")
interface RelativeTimeProps {
  targetTime: Date;
  className?: string;
}

export function RelativeTime({ targetTime, className = '' }: RelativeTimeProps) {
  const [text, setText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateText = () => {
      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();

      if (diff <= 0) {
        setText('Starting now');
        setIsUrgent(true);
      } else if (diff < 60000) {
        setText('Less than a minute');
        setIsUrgent(true);
      } else if (diff < 3600000) {
        const mins = Math.ceil(diff / 60000);
        setText(`${mins} min`);
        setIsUrgent(diff < 5 * 60000);
      } else if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        setText(`${hours}h ${mins}m`);
        setIsUrgent(false);
      } else {
        const days = Math.floor(diff / 86400000);
        setText(`${days} day${days > 1 ? 's' : ''}`);
        setIsUrgent(false);
      }
    };

    updateText();
    const interval = setInterval(updateText, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const color = isUrgent ? '#FF3366' : '#FFB800';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${className}`}
      style={{ color }}
    >
      <Clock className="w-4 h-4" />
      {text}
    </span>
  );
}
