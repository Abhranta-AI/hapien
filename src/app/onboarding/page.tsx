'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Camera, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Building2,
  GraduationCap,
  Home,
  Search,
  X,
  MapPin,
  Send
} from 'lucide-react'
import { Button, Input, Textarea } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { cn } from '@/utils/helpers'

const INTERESTS = [
  'Sports', 'Fitness', 'Food', 'Travel', 'Music', 'Movies',
  'Reading', 'Gaming', 'Photography', 'Art', 'Tech', 'Business',
  'Cooking', 'Fashion', 'Pets', 'Gardening', 'Yoga', 'Dance'
]

const STEPS = ['profile', 'interests', 'community'] as const
type Step = typeof STEPS[number]

const COMMUNITY_TYPES = [
  { value: 'society', label: 'Society', description: 'Residential complex' },
  { value: 'campus', label: 'Campus', description: 'College or university' },
  { value: 'office', label: 'Office', description: 'Workplace or coworking' },
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const { authUser, refreshProfile } = useAuth()
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState<Step>('profile')
  const [isLoading, setIsLoading] = useState(false)

  // Profile state
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Interests state
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  // Community state
  const [communitySearch, setCommunitySearch] = useState('')
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null)

  // Community request modal state
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [requestData, setRequestData] = useState({
    name: '',
    type: 'society' as 'society' | 'campus' | 'office',
    location: '',
    description: ''
  })

  const stepIndex = STEPS.indexOf(currentStep)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleNext = () => {
    if (currentStep === 'profile' && !name.trim()) {
      toast.error('Please enter your name')
      return
    }

    const nextIndex = stepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex])
    }
  }

  const handleBack = () => {
    const prevIndex = stepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex])
    }
  }

  const handleSubmitCommunityRequest = async () => {
    console.log('=== handleSubmitCommunityRequest CALLED ===')
    console.log('Request data:', requestData)
    console.log('authUser:', authUser)

    // Validation checks
    if (!requestData.name.trim() || !requestData.location.trim()) {
      console.error('Validation failed: missing name or location')
      toast.error('Please fill in community name and location')
      return
    }

    // Check if user is authenticated
    if (!authUser?.id) {
      console.error('No authenticated user found')
      toast.error('You must be logged in to submit a request')
      setShowRequestModal(false)
      router.push('/auth')
      return
    }

    setIsSubmittingRequest(true)
    console.log('Starting community request submission...')

    try {
      const { data, error } = await (supabase
        .from('community_requests') as any)
        .insert({
          name: requestData.name.trim(),
          type: requestData.type,
          location: requestData.location.trim(),
          description: requestData.description.trim() || null,
          requested_by: authUser.id,
          status: 'pending',
        })
        .select()

      if (error) {
        console.error('Database error:', error)
        throw new Error(error.message)
      }

      console.log('Request submitted successfully:', data)
      toast.success('Community request submitted! We\'ll review it soon.')
      setShowRequestModal(false)
      setRequestData({ name: '', type: 'society', location: '', description: '' })
      
    } catch (error) {
      console.error('Request submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit request. Please try again.')
    } finally {
      setIsSubmittingRequest(false)
      console.log('Request submission complete')
    }
  }

  const handleComplete = async () => {
    // ALWAYS log first to prove function is called
    console.log('=== handleComplete CALLED ===')
    console.log('authUser:', authUser)
    console.log('name:', name)
    console.log('bio:', bio)
    console.log('selectedInterests:', selectedInterests)
    console.log('selectedCommunity:', selectedCommunity)
    
    // Check if user is authenticated
    if (!authUser?.id) {
      console.error('ERROR: No authenticated user!')
      toast.error('Please log in to continue')
      router.push('/auth')
      return
    }
    
    // Validate name is filled
    if (!name.trim()) {
      console.error('ERROR: Name is empty!')
      toast.error('Please enter your name')
      setCurrentStep('profile')
      return
    }

    console.log('✓ Validation passed, starting onboarding...')
    setIsLoading(true)

    try {
      let finalAvatarUrl = avatarUrl

      // Upload avatar if selected (NON-BLOCKING)
      if (avatarFile) {
        console.log('→ Uploading avatar...')
        try {
          const fileExt = avatarFile.name.split('.').pop()
          const fileName = `${authUser.id}.${fileExt}`
          
          const { error: uploadError } = await (supabase.storage
            .from('avatars') as any)
            .upload(fileName, avatarFile, { upsert: true })

          if (uploadError) {
            console.error('✗ Avatar upload failed:', uploadError)
            toast.error('Avatar upload failed, continuing anyway...')
          } else {
            const { data: { publicUrl } } = (supabase.storage
              .from('avatars') as any)
              .getPublicUrl(fileName)
            finalAvatarUrl = publicUrl
            console.log('✓ Avatar uploaded successfully:', publicUrl)
          }
        } catch (avatarError) {
          console.error('✗ Avatar error:', avatarError)
          // Continue anyway
        }
      }

      // Update user profile (CRITICAL)
      console.log('→ Updating profile with:', {
        name: name.trim(),
        bio: bio.trim() || null,
        avatar_url: finalAvatarUrl,
        interests: selectedInterests
      })

      const { error: updateError, data: updateData } = await (supabase
        .from('users') as any)
        .update({
          name: name.trim(),
          bio: bio.trim() || null,
          avatar_url: finalAvatarUrl,
          interests: selectedInterests.length > 0 ? selectedInterests : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id)
        .select()

      if (updateError) {
        console.error('✗ Profile update error:', updateError)
        throw new Error(`Failed to update profile: ${updateError.message}`)
      }

      console.log('✓ Profile updated successfully:', updateData)

      // Join community if selected (OPTIONAL/NON-BLOCKING)
      if (selectedCommunity) {
        console.log('→ Attempting to join community:', selectedCommunity)
        try {
          const { error: membershipError, data: membershipData } = await (supabase
            .from('community_memberships') as any)
            .insert({
              user_id: authUser.id,
              community_id: selectedCommunity,
              status: 'pending',
            })
            .select()

          if (membershipError) {
            console.error('✗ Community membership error:', membershipError)
            toast.error('Could not join community, but continuing...')
          } else {
            console.log('✓ Community joined successfully:', membershipData)
          }
        } catch (communityError) {
          console.error('✗ Community error:', communityError)
          // Continue anyway
        }
      }

      // Refresh profile
      console.log('→ Refreshing profile...')
      await refreshProfile()
      console.log('✓ Profile refreshed')

      console.log('✓✓✓ Onboarding complete! Redirecting to feed...')
      toast.success('Welcome to Hapien!')
      router.push('/feed')
      
    } catch (error) {
      console.error('✗✗✗ ONBOARDING ERROR:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Something went wrong. Please try again.'
      )
    } finally {
      console.log('→ Resetting loading state')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-mesh pointer-events-none opacity-30" />

      {/* Progress bar */}
      <div className="relative z-10 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-colors',
                  index <= stepIndex ? 'bg-primary-500' : 'bg-dark-card'
                )}
              />
            ))}
          </div>
          <p className="text-sm text-neutral-400 text-center">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* Step 1: Profile */}
            {currentStep === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold text-neutral-100 mb-2">
                    Create your profile
                  </h1>
                  <p className="text-neutral-400">
                    Tell us a bit about yourself
                  </p>
                </div>

                <div className="bg-dark-card rounded-3xl shadow-soft p-8 space-y-6 border border-dark-border">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-dark-hover flex items-center justify-center overflow-hidden border-2 border-primary-500/20">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-neutral-500" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-2 bg-primary-500 rounded-full cursor-pointer hover:bg-primary-600 transition-colors shadow-glow">
                        <Camera className="w-4 h-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-neutral-400">Upload profile photo</p>
                  </div>

                  {/* Name */}
                  <Input
                    label="Name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  {/* Bio */}
                  <Textarea
                    label="Bio (optional)"
                    placeholder="Tell us about yourself"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />

                  <Button
                    onClick={handleNext}
                    className="w-full"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Interests */}
            {currentStep === 'interests' && (
              <motion.div
                key="interests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold text-neutral-100 mb-2">
                    Pick your interests
                  </h1>
                  <p className="text-neutral-400">
                    Help us suggest hangouts you'll love
                  </p>
                </div>

                <div className="bg-dark-card rounded-3xl shadow-soft p-8 space-y-6 border border-dark-border">
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium transition-all',
                          selectedInterests.includes(interest)
                            ? 'bg-primary-500 text-white shadow-glow'
                            : 'bg-dark-hover text-neutral-300 hover:bg-dark-hover/80 hover:text-neutral-100'
                        )}
                      >
                        {selectedInterests.includes(interest) && (
                          <Check className="w-4 h-4 inline mr-1" />
                        )}
                        {interest}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleBack}
                      variant="ghost"
                      className="flex-1"
                      leftIcon={<ArrowLeft className="w-5 h-5" />}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex-1"
                      rightIcon={<ArrowRight className="w-5 h-5" />}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Community */}
            {currentStep === 'community' && (
              <motion.div
                key="community"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold text-neutral-100 mb-2">
                    Join a community
                  </h1>
                  <p className="text-neutral-400">
                    Where do you spend most of your time?
                  </p>
                </div>

                <div className="bg-dark-card rounded-3xl shadow-soft p-8 space-y-6 border border-dark-border">
                  {/* Community Types */}
                  <div className="grid grid-cols-3 gap-3">
                    <CommunityTypeCard
                      icon={Home}
                      label="Society"
                      description="Residential"
                    />
                    <CommunityTypeCard
                      icon={GraduationCap}
                      label="Campus"
                      description="College"
                    />
                    <CommunityTypeCard
                      icon={Building2}
                      label="Office"
                      description="Workplace"
                    />
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Search communities..."
                      value={communitySearch}
                      onChange={(e) => setCommunitySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-dark-hover border border-dark-border rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <p className="text-sm text-neutral-400 text-center">
                    Can't find yours?{' '}
                    <button 
                      onClick={() => setShowRequestModal(true)}
                      className="text-primary-400 hover:text-primary-300 hover:underline"
                    >
                      Request a new community
                    </button>
                  </p>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleBack}
                      variant="ghost"
                      className="flex-1"
                      leftIcon={<ArrowLeft className="w-5 h-5" />}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleComplete}
                      className="flex-1"
                      isLoading={isLoading}
                      rightIcon={<Check className="w-5 h-5" />}
                    >
                      Complete
                    </Button>
                  </div>

                  <button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="w-full text-sm text-neutral-400 hover:text-neutral-300 transition-colors disabled:opacity-50"
                  >
                    Skip for now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Community Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setShowRequestModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-dark-card rounded-3xl shadow-xl overflow-hidden border border-dark-border"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
                <h2 className="font-display text-xl font-bold text-neutral-100">
                  Request New Community
                </h2>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="p-2 rounded-full hover:bg-dark-hover transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Community Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-300">
                    Community Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {COMMUNITY_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setRequestData(prev => ({ ...prev, type: type.value }))}
                        className={cn(
                          'p-3 rounded-xl text-center transition-all border-2',
                          requestData.type === type.value
                            ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                            : 'bg-dark-hover border-dark-border text-neutral-400 hover:border-neutral-600'
                        )}
                      >
                        <p className="text-xs font-medium">{type.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Community Name */}
                <Input
                  label="Community Name"
                  placeholder="e.g., Green Valley Apartments"
                  value={requestData.name}
                  onChange={(e) => setRequestData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />

                {/* Location */}
                <Input
                  label="Location"
                  placeholder="City, State"
                  value={requestData.location}
                  onChange={(e) => setRequestData(prev => ({ ...prev, location: e.target.value }))}
                  leftIcon={<MapPin className="w-4 h-4 text-neutral-500" />}
                  required
                />

                {/* Description */}
                <Textarea
                  label="Description (optional)"
                  placeholder="Any additional details..."
                  value={requestData.description}
                  onChange={(e) => setRequestData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setShowRequestModal(false)}
                    disabled={isSubmittingRequest}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmitCommunityRequest}
                    isLoading={isSubmittingRequest}
                    disabled={!requestData.name.trim() || !requestData.location.trim()}
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    Submit Request
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CommunityTypeCard({
  icon: Icon,
  label,
  description,
}: {
  icon: typeof Home
  label: string
  description: string
}) {
  return (
    <button className="p-4 rounded-2xl bg-dark-hover hover:bg-dark-hover/80 transition-colors text-center group border border-dark-border">
      <div className="w-10 h-10 rounded-xl bg-dark-card flex items-center justify-center mx-auto mb-2 group-hover:shadow-soft transition-shadow border border-dark-border">
        <Icon className="w-5 h-5 text-primary-400" />
      </div>
      <p className="font-medium text-neutral-200 text-sm">{label}</p>
      <p className="text-xs text-neutral-500">{description}</p>
    </button>
  )
}
