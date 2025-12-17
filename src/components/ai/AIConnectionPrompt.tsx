'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Clock, Sparkles } from 'lucide-react'
import { User, HAPIEN_AI } from '@/types/database'
import { createConnectionPrompt } from '@/lib/hapien-ai'

interface AIConnectionPromptProps {
  otherUser: User
  hangoutId: string
  hangoutTitle: string
  category: string
  onAccept: () => void
  onDecline: () => void
  onClose: () => void
  isOpen: boolean
}

export function AIConnectionPrompt({
  otherUser,
  hangoutId,
  hangoutTitle,
  category,
  onAccept,
  onDecline,
  onClose,
  isOpen
}: AIConnectionPromptProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Generate AI message
  const notification = createConnectionPrompt(
    '', // userId not needed for display
    otherUser,
    hangoutId,
    hangoutTitle,
    category
  )

  const handleAccept = async () => {
    setIsLoading(true)
    await onAccept()
    setIsLoading(false)
  }

  const handleDecline = async () => {
    setIsLoading(true)
    await onDecline()
    setIsLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="card-dark-elevated p-6 rounded-2xl border border-coral-500/20">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="text-center">
                {/* AI Avatar with animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="relative w-16 h-16 mx-auto mb-4"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-coral-500 to-urgent-500 blur-md opacity-50" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-coral-500 to-urgent-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </motion.div>

                {/* Hapien name */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm font-medium text-coral-400 mb-4"
                >
                  {HAPIEN_AI.name} says...
                </motion.p>

                {/* User being connected with */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center mb-4"
                >
                  <div className="relative">
                    {otherUser.avatar_url ? (
                      <img
                        src={otherUser.avatar_url}
                        alt={otherUser.name || 'User'}
                        className="w-20 h-20 rounded-full object-cover border-4 border-dark-elevated"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-jade-500/20 flex items-center justify-center border-4 border-dark-elevated">
                        <span className="text-2xl font-bold text-jade-500">
                          {(otherUser.name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-jade-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <UserPlus className="w-4 h-4 text-white" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* User name */}
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg font-semibold text-text-primary mb-2"
                >
                  {otherUser.name || 'Your hangout partner'}
                </motion.h3>

                {/* AI Message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-text-secondary mb-6 leading-relaxed"
                >
                  {notification.message}
                </motion.p>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3"
                >
                  <button
                    onClick={handleDecline}
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 rounded-xl border border-dark-border text-text-secondary hover:bg-dark-surface transition-colors flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Not this time
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-coral-500 to-urgent-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {isLoading ? 'Connecting...' : 'Yes, connect us!'}
                  </button>
                </motion.div>

                {/* Note */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-xs text-text-muted mt-4"
                >
                  Both of you need to accept to become connected
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
