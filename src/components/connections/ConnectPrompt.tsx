'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Clock } from 'lucide-react'
import { User } from '@/types/database'

interface ConnectPromptProps {
  otherUser: User
  hangoutTitle: string
  onAccept: () => void
  onDecline: () => void
  onClose: () => void
  isOpen: boolean
}

export function ConnectPrompt({
  otherUser,
  hangoutTitle,
  onAccept,
  onDecline,
  onClose,
  isOpen
}: ConnectPromptProps) {
  const [isLoading, setIsLoading] = useState(false)

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
            <div className="card-dark-elevated p-6 rounded-2xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="text-center">
                {/* Celebration emoji */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="text-5xl mb-4"
                >
                  🎉
                </motion.div>

                {/* Title */}
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  Great hangout with {otherUser.name || 'your new friend'}!
                </h2>

                {/* Subtitle */}
                <p className="text-text-secondary mb-6">
                  {hangoutTitle}
                </p>

                {/* User avatar */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {otherUser.avatar_url ? (
                      <img
                        src={otherUser.avatar_url}
                        alt={otherUser.name || 'User'}
                        className="w-20 h-20 rounded-full object-cover border-4 border-dark-elevated"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-coral-500/20 flex items-center justify-center border-4 border-dark-elevated">
                        <span className="text-2xl font-bold text-coral-500">
                          {(otherUser.name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-jade-500 rounded-full flex items-center justify-center"
                    >
                      <UserPlus className="w-4 h-4 text-white" />
                    </motion.div>
                  </div>
                </div>

                {/* Question */}
                <p className="text-text-primary font-medium mb-6">
                  Stay connected to see each other's updates?
                </p>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDecline}
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 rounded-xl border border-dark-border text-text-secondary hover:bg-dark-surface transition-colors flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Maybe later
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-coral-500 to-urgent-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {isLoading ? 'Connecting...' : 'Yes, connect!'}
                  </button>
                </div>

                {/* Note */}
                <p className="text-xs text-text-muted mt-4">
                  Both of you need to accept to become connected
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
