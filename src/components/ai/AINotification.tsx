'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { AINotificationData, HAPIEN_AI } from '@/types/database'

interface AINotificationProps {
  notification: AINotificationData
  onAction: (action: string) => void
  onDismiss: () => void
}

export function AINotification({ notification, onAction, onDismiss }: AINotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300)
  }

  const handleAction = (action: string) => {
    if (action === 'dismiss') {
      handleDismiss()
    } else {
      onAction(action)
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="card-dark-elevated rounded-2xl p-4 shadow-2xl border border-coral-500/20">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* AI Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-500 to-urgent-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm">{HAPIEN_AI.name}</h4>
                  <p className="text-xs text-text-muted">Just now</p>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Context user avatar (if present) */}
            {notification.context_user && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-dark-surface rounded-lg">
                {notification.context_user.avatar_url ? (
                  <img
                    src={notification.context_user.avatar_url}
                    alt={notification.context_user.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-jade-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-jade-500">
                      {(notification.context_user.name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-text-primary">
                  {notification.context_user.name}
                </span>
              </div>
            )}

            {/* Message */}
            <p className="text-text-primary text-sm leading-relaxed mb-4 whitespace-pre-wrap">
              {notification.message}
            </p>

            {/* Action buttons */}
            {notification.action_buttons && notification.action_buttons.length > 0 && (
              <div className="flex gap-2">
                {notification.action_buttons.map((button, index) => (
                  <button
                    key={index}
                    onClick={() => handleAction(button.action)}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                      button.variant === 'primary'
                        ? 'bg-gradient-to-r from-coral-500 to-urgent-500 text-white hover:opacity-90'
                        : 'bg-dark-surface text-text-secondary hover:bg-dark-elevated hover:text-text-primary'
                    }`}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
