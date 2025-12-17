'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Coffee, Utensils, Wine, Lock, Check } from 'lucide-react'
import { DatingPreferences as DatingPreferencesType, DateType } from '@/types/database'

interface DatingPreferencesProps {
  initialPreferences: DatingPreferencesType | null
  onSave: (preferences: DatingPreferencesType) => Promise<void>
}

const dateTypeOptions: { type: DateType; label: string; icon: React.ReactNode; emoji: string }[] = [
  { type: 'coffee', label: 'Coffee Dates', icon: <Coffee className="w-5 h-5" />, emoji: '☕' },
  { type: 'dinner', label: 'Dinner Dates', icon: <Utensils className="w-5 h-5" />, emoji: '🍽️' },
  { type: 'drinks', label: 'Drinks Dates', icon: <Wine className="w-5 h-5" />, emoji: '🍷' },
]

export function DatingPreferences({ initialPreferences, onSave }: DatingPreferencesProps) {
  const [openToDating, setOpenToDating] = useState(initialPreferences?.open_to_dating ?? false)
  const [selectedTypes, setSelectedTypes] = useState<DateType[]>(initialPreferences?.date_types ?? [])
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleDateType = (type: DateType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
    setSaved(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        open_to_dating: openToDating,
        date_types: openToDating ? selectedTypes : []
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="card-dark p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
          <Heart className="w-5 h-5 text-pink-500" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Dating Preferences</h3>
          <p className="text-sm text-text-muted flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Only visible to you
          </p>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="bg-dark-surface rounded-xl p-4 mb-6 border border-dark-border">
        <p className="text-sm text-text-secondary">
          Your dating preferences are <strong className="text-text-primary">completely private</strong>.
          Other users cannot see whether you're open to dating or what types of dates you prefer.
        </p>
      </div>

      {/* Open to dating toggle */}
      <div className="mb-6">
        <p className="text-sm text-text-secondary mb-3">Are you open to dating on Hapien?</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setOpenToDating(true)
              setSaved(false)
            }}
            className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
              openToDating
                ? 'border-pink-500 bg-pink-500/10 text-pink-500'
                : 'border-dark-border text-text-muted hover:border-text-muted'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {openToDating && <Check className="w-4 h-4" />}
              <span className="font-medium">Yes</span>
            </div>
          </button>
          <button
            onClick={() => {
              setOpenToDating(false)
              setSaved(false)
            }}
            className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
              !openToDating
                ? 'border-text-muted bg-dark-surface text-text-primary'
                : 'border-dark-border text-text-muted hover:border-text-muted'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {!openToDating && <Check className="w-4 h-4" />}
              <span className="font-medium">No</span>
            </div>
          </button>
        </div>
      </div>

      {/* Date types selection */}
      <motion.div
        initial={false}
        animate={{
          height: openToDating ? 'auto' : 0,
          opacity: openToDating ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="mb-6">
          <p className="text-sm text-text-secondary mb-3">What types of dates are you open to?</p>
          <div className="grid grid-cols-1 gap-3">
            {dateTypeOptions.map(option => (
              <button
                key={option.type}
                onClick={() => toggleDateType(option.type)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  selectedTypes.includes(option.type)
                    ? 'border-pink-500 bg-pink-500/10'
                    : 'border-dark-border hover:border-text-muted'
                }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className={`flex-1 text-left font-medium ${
                  selectedTypes.includes(option.type) ? 'text-pink-500' : 'text-text-primary'
                }`}>
                  {option.label}
                </span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedTypes.includes(option.type)
                    ? 'border-pink-500 bg-pink-500'
                    : 'border-dark-border'
                }`}>
                  {selectedTypes.includes(option.type) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
          saved
            ? 'bg-jade-500 text-white'
            : 'bg-pink-500 text-white hover:bg-pink-600'
        } disabled:opacity-50`}
      >
        {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
      </button>
    </div>
  )
}
