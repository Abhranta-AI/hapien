'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Zap, Star, Gift, Flame, Trophy } from 'lucide-react';
import type { XPEventType } from '@/lib/gamification/xp';

interface XPGainToastProps {
  amount: number;
  reason: string;
  eventType?: XPEventType;
  multiplier?: number;
  onComplete?: () => void;
  duration?: number;
}

const getIconForEvent = (eventType?: XPEventType) => {
  switch (eventType) {
    case 'MEET_NEW_PERSON':
      return <Star className="w-5 h-5" />;
    case 'MYSTERY_BONUS':
      return <Gift className="w-5 h-5" />;
    case 'DAILY_STREAK_BONUS':
    case 'WEEKLY_STREAK_BONUS':
      return <Flame className="w-5 h-5" />;
    case 'ACTIVITY_MILESTONE':
      return <Trophy className="w-5 h-5" />;
    default:
      return <Zap className="w-5 h-5" />;
  }
};

const getColorForEvent = (eventType?: XPEventType, multiplier?: number) => {
  if (multiplier && multiplier > 1) {
    return multiplier >= 3 ? '#FF3366' : multiplier >= 2 ? '#FFB800' : '#FF8C00';
  }

  switch (eventType) {
    case 'MEET_NEW_PERSON':
    case 'REACH_CLOSE_FRIEND_STATUS':
      return '#00D9A5'; // jade
    case 'MYSTERY_BONUS':
    case 'HAPPY_HOUR_MULTIPLIER':
      return '#A78BFA'; // purple
    case 'ACTIVITY_MILESTONE':
      return '#FFB800'; // gold
    default:
      return '#FF6B35'; // coral
  }
};

export function XPGainToast({
  amount,
  reason,
  eventType,
  multiplier,
  onComplete,
  duration = 3000,
}: XPGainToastProps) {
  const [visible, setVisible] = useState(true);
  const icon = getIconForEvent(eventType);
  const color = getColorForEvent(eventType, multiplier);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onComplete?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color}20 0%, #1A1A1E 100%)`,
              border: `1px solid ${color}40`,
            }}
          >
            {/* Icon */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="flex-shrink-0"
              style={{ color }}
            >
              {icon}
            </motion.div>

            {/* Content */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="text-xl font-bold"
                  style={{ color }}
                >
                  +{amount}
                </motion.span>
                <span className="text-sm font-semibold" style={{ color }}>
                  XP
                </span>
                {multiplier && multiplier > 1 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ delay: 0.2 }}
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: color, color: '#1A1A1E' }}
                  >
                    {multiplier}x
                  </motion.span>
                )}
              </div>
              <span className="text-xs text-text-muted">{reason}</span>
            </div>

            {/* Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    x: (Math.random() - 0.5) * 100,
                    y: -50 - Math.random() * 50,
                  }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Level up celebration modal
interface LevelUpModalProps {
  newLevel: number;
  levelTitle: string;
  unlocks?: { icon: string; description: string }[];
  onClose: () => void;
}

export function LevelUpModal({ newLevel, levelTitle, unlocks, onClose }: LevelUpModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="card-dark-elevated p-8 mx-4 max-w-sm text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: '50%', opacity: 1 }}
              animate={{
                y: 400,
                x: `${Math.random() * 100}%`,
                rotate: Math.random() * 720,
                opacity: 0,
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: Math.random() * 0.5,
                ease: 'easeOut',
              }}
              className="absolute top-0 w-3 h-3"
              style={{
                background: ['#FFB800', '#FF6B35', '#00D9A5', '#FF3366'][Math.floor(Math.random() * 4)],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-text-primary mb-2"
        >
          Level Up!
        </motion.h2>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-3xl font-bold mb-4"
          style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF8C00 100%)', color: '#1A1A1E' }}
        >
          {newLevel}
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg font-semibold text-gold-500 mb-4"
        >
          {levelTitle}
        </motion.p>

        {unlocks && unlocks.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 pt-4 border-t border-dark-border"
          >
            <p className="text-sm text-text-muted mb-3">New unlocks:</p>
            <div className="space-y-2">
              {unlocks.map((unlock, i) => (
                <div key={i} className="flex items-center gap-2 text-text-primary">
                  <span>{unlock.icon}</span>
                  <span className="text-sm">{unlock.description}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onClose}
          className="mt-6 w-full btn-join"
        >
          Awesome!
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
