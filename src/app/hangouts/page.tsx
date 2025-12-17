'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Grid3X3,
  List,
  MapPin,
  Plus,
  Filter,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { HangoutCard } from '@/components/hangouts/HangoutCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/Badge'
import { LoadingScreen, HangoutCardSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { HangoutWithRelations, HangoutCategory } from '@/types/database'
import { cn, categoryConfig } from '@/utils/helpers'

type ViewMode = 'grid' | 'list' | 'calendar'
type TimeFilter = 'this-week' | 'this-month' | 'all'

export default function HangoutsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('this-week')
  const [categoryFilter, setCategoryFilter] = useState<HangoutCategory | 'all'>('all')
  const [hangouts, setHangouts] = useState<HangoutWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchHangouts = useCallback(async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // Get user's community IDs
      const { data: memberships } = await supabase
        .from('community_memberships')
        .select('community_id')
        .eq('user_id', user.id)
        .eq('status', 'approved')

      const communityIds = (memberships as any[])?.map((m: any) => m.community_id) || []

      if (communityIds.length === 0) {
        setHangouts([])
        setIsLoading(false)
        return
      }

      // Build date filter
      const now = new Date()
      let dateFilter = now.toISOString()
      let endDate: Date | null = null

      if (timeFilter === 'this-week') {
        endDate = new Date(now)
        endDate.setDate(now.getDate() + 7)
      } else if (timeFilter === 'this-month') {
        endDate = new Date(now)
        endDate.setMonth(now.getMonth() + 1)
      }

      let query = supabase
        .from('hangouts')
        .select(`
          *,
          host:users!host_id(*),
          community:communities!community_id(*),
          rsvps:hangout_rsvps(*, user:users!user_id(*))
        `)
        .in('community_id', communityIds)
        .gte('date_time', dateFilter)
        .eq('status', 'upcoming')
        .order('date_time', { ascending: true })

      if (endDate) {
        query = query.lte('date_time', endDate.toISOString())
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      const { data, error } = await query

      if (error) throw error

      const transformedHangouts: HangoutWithRelations[] = (data || []).map((hangout: any) => ({
        ...hangout,
        host: hangout.host,
        community: hangout.community,
        rsvps: hangout.rsvps || [],
        comments: [],
        going_count: hangout.rsvps?.filter((r: any) => r.status === 'going').length || 0,
        interested_count: hangout.rsvps?.filter((r: any) => r.status === 'interested').length || 0,
      }))

      setHangouts(transformedHangouts)
    } catch (error) {
      console.error('Error fetching hangouts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, timeFilter, categoryFilter, supabase])

  useEffect(() => {
    fetchHangouts()
  }, [fetchHangouts])

  // Group hangouts by date for calendar view
  const groupedHangouts = hangouts.reduce((acc, hangout) => {
    const dateKey = new Date(hangout.date_time).toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(hangout)
    return acc
  }, {} as Record<string, HangoutWithRelations[]>)

  if (authLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return null
  }

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-neutral-100">
                Hangouts
              </h1>
              <p className="text-neutral-400 mt-1">
                Discover what&apos;s happening in your communities
              </p>
            </div>
            <Link href="/hangouts/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Host
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Time Filter */}
            <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <TabsList>
                <TabsTrigger value="this-week">This Week</TabsTrigger>
                <TabsTrigger value="this-month">This Month</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setCategoryFilter('all')}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  categoryFilter === 'all'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-dark-elevated text-neutral-400 hover:bg-dark-hover'
                )}
              >
                All
              </button>
              {(Object.entries(categoryConfig) as [HangoutCategory, typeof categoryConfig.sports][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    categoryFilter === key
                      ? `bg-${config.color}-500 text-white`
                      : 'bg-dark-elevated text-neutral-400 hover:bg-dark-hover'
                  )}
                >
                  <span>{config.emoji}</span>
                  {config.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid' ? 'bg-primary-100 text-primary-400' : 'text-neutral-400 hover:bg-dark-elevated'
                )}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list' ? 'bg-primary-100 text-primary-400' : 'text-neutral-400 hover:bg-dark-elevated'
                )}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'calendar' ? 'bg-primary-100 text-primary-400' : 'text-neutral-400 hover:bg-dark-elevated'
                )}
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-4'
            )}>
              {[...Array(6)].map((_, i) => (
                <HangoutCardSkeleton key={i} />
              ))}
            </div>
          ) : hangouts.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No hangouts found"
              description={
                categoryFilter !== 'all'
                  ? `No ${categoryConfig[categoryFilter].label.toLowerCase()} hangouts right now`
                  : "Be the first to host a hangout in your community!"
              }
              action={{
                label: "Host a Hangout",
                href: "/hangouts/create"
              }}
            />
          ) : viewMode === 'calendar' ? (
            // Calendar View
            <div className="space-y-6">
              {Object.entries(groupedHangouts).map(([dateKey, dateHangouts]) => {
                const date = new Date(dateKey)
                const isToday = date.toDateString() === new Date().toDateString()
                const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString()

                return (
                  <div key={dateKey}>
                    <h3 className={cn(
                      'text-lg font-semibold mb-3 sticky top-20 bg-dark-card/80 backdrop-blur-sm py-2 z-10',
                      isToday ? 'text-secondary-600' : 'text-neutral-100'
                    )}>
                      {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </h3>
                    <div className="space-y-3">
                      {dateHangouts.map((hangout, index) => (
                        <motion.div
                          key={hangout.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <HangoutCard 
                            hangout={hangout} 
                            onRsvpChange={fetchHangouts}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // Grid/List View
            <AnimatePresence mode="popLayout">
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-4'
              )}>
                {hangouts.map((hangout, index) => (
                  <motion.div
                    key={hangout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <HangoutCard
                      hangout={hangout}
                      compact={viewMode === 'grid'}
                      onRsvpChange={fetchHangouts}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>

    </AppShell>
  )
}
