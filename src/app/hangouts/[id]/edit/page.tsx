'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Button, Card, Input, Textarea } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Hangout, HangoutCategory } from '@/types/database'
import { cn, categoryConfig } from '@/utils/helpers'
import toast from 'react-hot-toast'

interface EditHangoutPageProps {
  params: Promise<{ id: string }>
}

export default function EditHangoutPage({ params }: EditHangoutPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [hangout, setHangout] = useState<Hangout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<HangoutCategory>('chill')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')

  const fetchHangout = useCallback(async () => {
    if (!id || !user) return

    try {
      const { data, error } = await supabase
        .from('hangouts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      const hangoutData = data as Hangout

      if (hangoutData.host_id !== user.id) {
        toast.error('You can only edit your own hangouts')
        router.push(`/hangouts/${id}`)
        return
      }

      setHangout(hangoutData)

      // Populate form
      setTitle(hangoutData.title)
      setDescription(hangoutData.description || '')
      setCategory(hangoutData.category)
      setMaxParticipants(hangoutData.max_participants?.toString() || '')

      if (hangoutData.location) {
        setLocationAddress(hangoutData.location.address || '')
      }

      // Parse date and time
      const dateTime = new Date(hangoutData.date_time)
      setDate(dateTime.toISOString().split('T')[0])
      setTime(dateTime.toTimeString().slice(0, 5))
    } catch (error) {
      console.error('Error fetching hangout:', error)
      toast.error('Failed to load hangout')
      router.push('/hangouts')
    } finally {
      setIsLoading(false)
    }
  }, [id, user, supabase, router])

  useEffect(() => {
    if (user) {
      fetchHangout()
    }
  }, [user, fetchHangout])

  const handleSave = async () => {
    if (!hangout || !user || isSaving) return

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!date || !time) {
      toast.error('Date and time are required')
      return
    }

    setIsSaving(true)

    try {
      const dateTime = new Date(`${date}T${time}`)

      const { error } = await (supabase
        .from('hangouts') as any)
        .update({
          title: title.trim(),
          description: description.trim() || null,
          category,
          date_time: dateTime.toISOString(),
          location: locationAddress ? { address: locationAddress } : null,
          max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        })
        .eq('id', hangout.id)

      if (error) throw error

      toast.success('Hangout updated!')
      router.push(`/hangouts/${hangout.id}`)
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update hangout')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!user || !hangout) {
    return null
  }

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-neutral-100">
              Edit Hangout
            </h1>
            <p className="text-neutral-400 mt-1">
              Update your hangout details
            </p>
          </div>

          {/* Form */}
          <Card variant="elevated" padding="lg">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What are you doing?"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell people more about this hangout..."
                  rows={3}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(categoryConfig) as HangoutCategory[]).map((cat) => {
                    const config = categoryConfig[cat]
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all',
                          category === cat
                            ? `border-${config.color.split('-')[1]}-500 bg-${config.color.split('-')[1]}-50`
                            : 'border-dark-border hover:border-neutral-300'
                        )}
                      >
                        <span>{config.emoji}</span>
                        <span className="font-medium">{config.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Location
                </label>
                <Input
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="Where are you meeting?"
                />
              </div>

              {/* Max Participants */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Max Participants (optional)
                </label>
                <Input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="Leave empty for no limit"
                  min="2"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

    </AppShell>
  )
}
