'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Sparkles, X } from 'lucide-react'
import { HAPIEN_AI } from '@/types/database'

interface AIChatBubbleProps {
  onClick: () => void
  hasUnread?: boolean
}

export function AIChatBubble({ onClick, hasUnread = false }: AIChatBubbleProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', delay: 0.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="fixed bottom-28 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-coral-500 to-urgent-500 shadow-lg flex items-center justify-center group"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-coral-500 to-urgent-500 blur-md opacity-50 group-hover:opacity-70 transition-opacity" />

      {/* Icon */}
      <div className="relative">
        <Sparkles className="w-6 h-6 text-white" />
      </div>

      {/* Unread indicator */}
      {hasUnread && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-jade-500 rounded-full border-2 border-dark-bg"
        />
      )}

      {/* Hover label */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute right-full mr-3 px-3 py-1.5 bg-dark-elevated rounded-lg whitespace-nowrap"
          >
            <span className="text-sm text-text-primary font-medium">Ask {HAPIEN_AI.name}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
