'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  Users,
  MapPin,
  Zap,
  Search,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react'
import { cn, categoryConfig } from '@/utils/helpers'
import toast from 'react-hot-toast'

type Step = 'category' | 'when' | 'who' | 'where' | 'searching' | 'matched'

interface ActivityCategory {
  id: string
  emoji: string
  label: string
  color: string
}

const categories: ActivityCategory[] = [
  { id: 'badminton', emoji: '🏸', label: 'Badminton', color: '#FF6B35' },
  { id: 'coffee', emoji: '☕', label: 'Coffee', color: '#D99700' },
  { id: 'food', emoji: '🍕', label: 'Food', color: '#FF3366' },
  { id: 'walk', emoji: '🚶', label: 'Walk', color: '#00D9A5' },
  { id: 'shopping', emoji: '🛍️', label: 'Shopping', color: '#A78BFA' },
  { id: 'movie', emoji: '🎬', label: 'Movie', color: '#F472B6' },
  { id: 'gym', emoji: '💪', label: 'Gym', color: '#34D399' },
  { id: 'gaming', emoji: '🎮', label: 'Gaming', color: '#60A5FA' },
]

const whenOptions = [
  { id: 'now', label: 'NOW', emoji: '⚡', description: 'Right now!' },
  { id: '30min', label: '30 min', emoji: '🕐', description: 'In 30 minutes' },
  { id: '1hour', label: '1 hour', emoji: '🕑', description: 'In an hour' },
  { id: 'later', label: 'Later', emoji: '📅', description: 'Schedule for later' },
]

const whoOptions = [
  { id: '1', label: '1', description: 'Just one person' },
  { id: '2-3', label: '2-3', description: 'Small group' },
  { id: 'open', label: 'Open', description: "Anyone who's interested" },
]

export default function CreateActivityPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null)
  const [selectedWhen, setSelectedWhen] = useState<string | null>(null)
  const [selectedWho, setSelectedWho] = useState<string | null>(null)
  const [customActivity, setCustomActivity] = useState('')
  const [matchedUser, setMatchedUser] = useState<{ name: string; tower: string } | null>(null)

  const handleCategorySelect = (category: ActivityCategory) => {
    setSelectedCategory(category)
    setStep('when')
  }

  const handleWhenSelect = (when: string) => {
    setSelectedWhen(when)
    setStep('who')
  }

  const handleWhoSelect = (who: string) => {
    setSelectedWho(who)
    // Skip 'where' step for now, go straight to searching
    setStep('searching')

    // Simulate finding a partner
    setTimeout(() => {
      setMatchedUser({ name: 'Rahul', tower: 'Tower B' })
      setStep('matched')
    }, 2500)
  }

  const handleBack = () => {
    switch (step) {
      case 'when':
        setStep('category')
        break
      case 'who':
        setStep('when')
        break
      case 'where':
        setStep('who')
        break
      default:
        router.back()
    }
  }

  const handleConfirm = () => {
    toast.success("You're all set! See you there!")
    router.push('/feed')
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 py-4 safe-top">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-text-primary">
            {step === 'category' && 'What do you want to do?'}
            {step === 'when' && `${selectedCategory?.emoji} ${selectedCategory?.label}`}
            {step === 'who' && `${selectedCategory?.emoji} ${selectedCategory?.label}`}
            {step === 'searching' && 'Finding you a partner...'}
            {step === 'matched' && 'Match Found!'}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Category Selection */}
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-4 gap-3 mb-6">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-2xl',
                      'border border-dark-border',
                      'hover:border-coral-500/50 hover:bg-dark-surface/80',
                      'transition-all duration-200'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-3xl">{category.emoji}</span>
                    <span className="text-xs text-text-secondary font-medium">
                      {category.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Custom activity input */}
              <div className="card-dark p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-dark-elevated">
                    <span className="text-xl">✏️</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Something else..."
                    value={customActivity}
                    onChange={(e) => setCustomActivity(e.target.value)}
                    className={cn(
                      'flex-1 bg-transparent border-none outline-none',
                      'text-text-primary placeholder-text-muted'
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customActivity.trim()) {
                        handleCategorySelect({
                          id: 'custom',
                          emoji: '🎯',
                          label: customActivity,
                          color: '#FF6B35'
                        })
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: When */}
          {step === 'when' && (
            <motion.div
              key="when"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-text-secondary text-sm mb-4">When?</p>
              <div className="grid grid-cols-4 gap-3">
                {whenOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleWhenSelect(option.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-2xl',
                      'border border-dark-border',
                      option.id === 'now'
                        ? 'border-coral-500/50 bg-coral-500/10'
                        : 'hover:border-coral-500/50 hover:bg-dark-surface/80',
                      'transition-all duration-200'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className={cn(
                      'text-sm font-bold',
                      option.id === 'now' ? 'text-coral-500' : 'text-text-primary'
                    )}>
                      {option.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: How many people */}
          {step === 'who' && (
            <motion.div
              key="who"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-text-secondary text-sm mb-4">How many people?</p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {whoOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleWhoSelect(option.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-2xl',
                      'border border-dark-border',
                      'hover:border-coral-500/50 hover:bg-dark-surface/80',
                      'transition-all duration-200'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Users className="w-6 h-6 text-text-secondary" />
                    <span className="text-lg font-bold text-text-primary">
                      {option.label}
                    </span>
                    <span className="text-xs text-text-muted">
                      {option.description}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Location hint */}
              <div className="card-dark p-4 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-jade-500" />
                <div>
                  <p className="text-text-primary text-sm font-medium">
                    Clubhouse Court
                  </p>
                  <p className="text-text-muted text-xs">
                    Default for {selectedCategory?.label?.toLowerCase()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Searching Animation */}
          {step === 'searching' && (
            <motion.div
              key="searching"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <motion.div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
                style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF3366 100%)' }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="text-5xl">{selectedCategory?.emoji}</span>
              </motion.div>

              <h2 className="text-xl font-bold text-text-primary mb-2 text-center">
                Finding you a {selectedCategory?.label?.toLowerCase()} partner...
              </h2>

              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  className="w-2 h-2 rounded-full bg-coral-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-coral-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-coral-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>

              <p className="text-text-secondary text-sm text-center">
                Notifying 12 {selectedCategory?.label?.toLowerCase()} players nearby
              </p>

              <p className="text-text-muted text-xs mt-8 text-center">
                First to respond gets the game!
              </p>
            </motion.div>
          )}

          {/* Match Found */}
          {step === 'matched' && matchedUser && (
            <motion.div
              key="matched"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="flex flex-col items-center justify-center py-8"
            >
              {/* Celebration */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-text-primary mb-8"
              >
                MATCH FOUND!
              </motion.h2>

              {/* Matched User Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card-dark-elevated p-6 w-full max-w-sm mb-6"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-coral-500/20 flex items-center justify-center mb-4 avatar-ring-active">
                    <span className="text-3xl font-bold text-coral-500">
                      {matchedUser.name[0]}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-1">
                    {matchedUser.name}
                  </h3>
                  <p className="text-text-secondary text-sm mb-4">
                    {matchedUser.tower}
                  </p>
                  <p className="text-text-secondary text-sm italic">
                    "I'm in! See you at the court."
                  </p>
                </div>
              </motion.div>

              {/* Activity Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card-dark p-4 w-full max-w-sm mb-8"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{selectedCategory?.emoji}</span>
                  <span className="text-text-primary font-semibold">
                    {selectedCategory?.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
                  <MapPin className="w-4 h-4 text-jade-500" />
                  <span>Clubhouse Court</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <Clock className="w-4 h-4 text-coral-500" />
                  <span>
                    {selectedWhen === 'now' && 'Starting now'}
                    {selectedWhen === '30min' && 'In 30 minutes'}
                    {selectedWhen === '1hour' && 'In 1 hour'}
                    {selectedWhen === 'later' && 'Later today'}
                  </span>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-sm space-y-3"
              >
                <button className="btn-secondary w-full flex items-center justify-center gap-2">
                  <span>💬</span>
                  <span>Message {matchedUser.name}</span>
                </button>
                <button
                  onClick={handleConfirm}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  <span>CONFIRMED</span>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer hint */}
      {(step === 'category' || step === 'when' || step === 'who') && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 glass-dark safe-bottom">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-text-muted text-sm justify-center">
              <Sparkles className="w-4 h-4" />
              <span>
                {step === 'category' && '8 people are looking for activities right now'}
                {step === 'when' && '3 people played badminton today'}
                {step === 'who' && '12 badminton players nearby'}
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
