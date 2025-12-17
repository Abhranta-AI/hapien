'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Image as ImageIcon,
  X,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { HangoutCategory, Community } from '@/types/database'
import { cn, categoryConfig } from '@/utils/helpers'
import toast from 'react-hot-toast'

const hangoutSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.enum(['sports', 'food', 'shopping', 'learning', 'chill', 'coffee_date', 'dinner_date', 'drinks_date']),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location_address: z.string().min(3, 'Location is required'),
  max_participants: z.string().optional(),
  visibility: z.enum(['friends', 'community', 'public_in_community']),
  community_id: z.string().min(1, 'Select a community'),
})

type HangoutFormData = z.infer<typeof hangoutSchema>

interface CreateHangoutProps {
  communities: Community[]
  onSuccess?: () => void
}

export function CreateHangout({ communities, onSuccess }: CreateHangoutProps) {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HangoutFormData>({
    resolver: zodResolver(hangoutSchema),
    defaultValues: {
      category: 'chill',
      visibility: 'community',
    },
  })

  const selectedCategory = watch('category')
  const selectedCommunity = watch('community_id')

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setCoverImage(null)
    setCoverPreview(null)
  }

  const onSubmit = async (data: HangoutFormData) => {
    if (!user) return

    setIsSubmitting(true)

    try {
      let coverImageUrl: string | null = null

      // Upload cover image if selected
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('hangouts')
          .upload(fileName, coverImage)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('hangouts')
          .getPublicUrl(fileName)

        coverImageUrl = publicUrl
      }

      // Combine date and time
      const dateTime = new Date(`${data.date}T${data.time}`)

      // Create hangout
      const { data: hangout, error } = await supabase
        .from('hangouts')
        .insert({
          host_id: user.id,
          community_id: data.community_id,
          title: data.title,
          description: data.description || null,
          category: data.category,
          date_time: dateTime.toISOString(),
          max_participants: data.max_participants ? parseInt(data.max_participants) : null,
          visibility: data.visibility,
          location: {
            address: data.location_address,
            lat: 0, // Would use geocoding in production
            lng: 0,
          },
          cover_image_url: coverImageUrl,
          status: 'upcoming',
        } as any)
        .select()
        .single()

      if (error) throw error

      toast.success('Hangout created!')
      onSuccess?.()
      router.push(`/hangouts/${(hangout as any).id}`)
    } catch (error) {
      console.error('Error creating hangout:', error)
      toast.error('Failed to create hangout')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Cover Image (optional)
        </label>
        {coverPreview ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-dark-elevated">
            <img
              src={coverPreview}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:border-primary-400 hover:text-primary-400 transition-colors"
          >
            <ImageIcon className="w-8 h-8" />
            <span className="text-sm">Add a cover image</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* Title */}
      <Input
        label="Title"
        placeholder="What's happening?"
        {...register('title')}
        error={errors.title?.message}
      />

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-3">
          Category
        </label>
        <div className="grid grid-cols-5 gap-2">
          {(Object.entries(categoryConfig) as [HangoutCategory, typeof categoryConfig.sports][]).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setValue('category', key)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                selectedCategory === key
                  ? `border-${config.color}-500 bg-${config.color}-50 shadow-soft border border-dark-border`
                  : 'border-transparent bg-dark-bg hover:bg-dark-elevated'
              )}
            >
              <span className="text-2xl">{config.emoji}</span>
              <span className={cn(
                'text-xs font-medium',
                selectedCategory === key ? `text-${config.color}-700` : 'text-neutral-400'
              )}>
                {config.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <Textarea
        label="Description"
        placeholder="Tell people what this hangout is about..."
        rows={3}
        {...register('description')}
      />

      {/* Community Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Community
        </label>
        <select
          {...register('community_id')}
          className={cn(
            'w-full px-4 py-3 rounded-xl border bg-dark-card',
            errors.community_id ? 'border-red-300' : 'border-dark-border',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400'
          )}
        >
          <option value="">Select a community</option>
          {communities.map((community) => (
            <option key={community.id} value={community.id}>
              {community.name}
            </option>
          ))}
        </select>
        {errors.community_id && (
          <p className="mt-1 text-sm text-tertiary-300">{errors.community_id.message}</p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          min={today}
          leftIcon={<Calendar className="w-4 h-4" />}
          {...register('date')}
          error={errors.date?.message}
        />
        <Input
          label="Time"
          type="time"
          leftIcon={<Clock className="w-4 h-4" />}
          {...register('time')}
          error={errors.time?.message}
        />
      </div>

      {/* Location */}
      <Input
        label="Location"
        placeholder="Where is this happening?"
        leftIcon={<MapPin className="w-4 h-4" />}
        {...register('location_address')}
        error={errors.location_address?.message}
      />

      {/* Max Participants */}
      <Input
        label="Max Participants (optional)"
        type="number"
        placeholder="Leave empty for unlimited"
        leftIcon={<Users className="w-4 h-4" />}
        {...register('max_participants')}
      />

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-3">
          Who can see this?
        </label>
        <div className="space-y-2">
          {[
            { value: 'community', label: 'Community members', desc: 'Anyone in the selected community' },
            { value: 'friends', label: 'Friends only', desc: 'Only your friends' },
            { value: 'public_in_community', label: 'Public in community', desc: 'Featured in community discover' },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                watch('visibility') === option.value
                  ? 'border-primary-500 bg-primary-900/30'
                  : 'border-transparent bg-dark-bg hover:bg-dark-elevated'
              )}
            >
              <input
                type="radio"
                value={option.value}
                {...register('visibility')}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-neutral-100">{option.label}</p>
                <p className="text-sm text-neutral-500">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={isSubmitting}
      >
        Create Hangout
      </Button>
    </form>
  )
}
