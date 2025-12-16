'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  GraduationCap,
  Building2,
  MapPin,
  Image as ImageIcon,
  ArrowLeft,
  X,
} from 'lucide-react'
import { AppShell, Header, BottomNav } from '@/components/layout'
import { Button, Card, Input, Textarea } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/helpers'
import toast from 'react-hot-toast'
import Link from 'next/link'

type CommunityType = 'society' | 'campus' | 'office'

const communityTypes = [
  {
    type: 'society' as CommunityType,
    label: 'Residential Society',
    description: 'Connect with neighbors in your housing society or apartment complex',
    icon: Home,
    color: 'tertiary',
  },
  {
    type: 'campus' as CommunityType,
    label: 'College Campus',
    description: 'Connect with fellow students and alumni from your college',
    icon: GraduationCap,
    color: 'primary',
  },
  {
    type: 'office' as CommunityType,
    label: 'Office Complex',
    description: 'Network with professionals in your office building or campus',
    icon: Building2,
    color: 'secondary',
  },
]

export default function CreateCommunityPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<CommunityType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const removeCover = () => {
    setCoverImage(null)
    setCoverPreview(null)
  }

  const handleSubmit = async () => {
    if (!user || !selectedType || !name.trim()) return

    setIsSubmitting(true)

    try {
      let coverImageUrl: string | null = null

      // Upload cover image if selected
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('communities')
          .upload(fileName, coverImage)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('communities')
          .getPublicUrl(fileName)

        coverImageUrl = publicUrl
      }

      // Create community
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert({
          name: name.trim(),
          type: selectedType,
          description: description.trim() || null,
          cover_image_url: coverImageUrl,
          admin_id: user.id,
          location: address || city ? {
            address: address.trim() || null,
            city: city.trim() || null,
          } : null,
          member_count: 1,
        } as any)
        .select()
        .single()

      if (communityError) throw communityError

      // Add creator as admin member
      await supabase.from('community_memberships').insert({
        user_id: user.id,
        community_id: (community as any).id,
        status: 'approved',
        role: 'admin',
      } as any)

      toast.success('Community created successfully!')
      router.push(`/communities/${(community as any).id}`)
    } catch (error) {
      console.error('Error creating community:', error)
      toast.error('Failed to create community')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    router.push('/auth/login')
    return <LoadingScreen message="Redirecting to login..." />
  }

  return (
    <AppShell>
      <Header />

      <main className="min-h-screen pt-16 pb-24 bg-gradient-to-b from-primary-50/30 via-white to-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Back button */}
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-100 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Communities
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-neutral-100">
              Create a Community
            </h1>
            <p className="text-neutral-400 mt-1">
              {step === 1 
                ? 'Choose what type of community you want to create'
                : 'Fill in the details for your community'}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              step >= 1 ? 'bg-primary-900/300 text-white' : 'bg-neutral-200 text-neutral-500'
            )}>
              1
            </div>
            <div className={cn('flex-1 h-1 rounded', step >= 2 ? 'bg-primary-900/300' : 'bg-neutral-200')} />
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              step >= 2 ? 'bg-primary-900/300 text-white' : 'bg-neutral-200 text-neutral-500'
            )}>
              2
            </div>
          </div>

          {/* Step 1: Select Type */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {communityTypes.map((type) => {
                const Icon = type.icon
                const isSelected = selectedType === type.type
                
                return (
                  <button
                    key={type.type}
                    onClick={() => setSelectedType(type.type)}
                    className={cn(
                      'w-full p-6 rounded-2xl border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary-500 bg-primary-900/30'
                        : 'border-dark-border bg-dark-card hover:border-neutral-300'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        type.color === 'tertiary' && 'bg-tertiary-100',
                        type.color === 'primary' && 'bg-primary-100',
                        type.color === 'secondary' && 'bg-secondary-100',
                      )}>
                        <Icon className={cn(
                          'w-6 h-6',
                          type.color === 'tertiary' && 'text-tertiary-600',
                          type.color === 'primary' && 'text-primary-400',
                          type.color === 'secondary' && 'text-secondary-600',
                        )} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-100">{type.label}</h3>
                        <p className="text-sm text-neutral-500 mt-1">{type.description}</p>
                      </div>
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        isSelected ? 'border-primary-500 bg-primary-900/300' : 'border-neutral-300'
                      )}>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-dark-card" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}

              <div className="pt-6">
                <Button
                  className="w-full"
                  onClick={() => setStep(2)}
                  disabled={!selectedType}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Cover Image (optional)
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
                {coverPreview ? (
                  <div className="relative h-40 rounded-xl overflow-hidden">
                    <img
                      src={coverPreview}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={removeCover}
                      className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center text-neutral-500 hover:border-neutral-400 hover:text-neutral-400 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm">Click to upload cover image</span>
                  </button>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Community Name *
                </label>
                <Input
                  placeholder="e.g., Prestige Lakeside Habitat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Description (optional)
                </label>
                <Textarea
                  placeholder="Tell people what this community is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-neutral-300">
                  Location
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <Input
                      placeholder="Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                  <Input
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={!name.trim()}
                >
                  Create Community
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <BottomNav />
    </AppShell>
  )
}
