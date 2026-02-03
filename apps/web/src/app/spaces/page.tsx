'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Users,
  MessageSquare,
  Heart,
  Briefcase,
  GraduationCap,
  Sparkles,
  Globe,
  Filter,
  Star,
} from 'lucide-react'
import { BottomNav } from '@/components/layout'
import { Button, Card, Badge } from '@/components/ui'
import { LoadingScreen, LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface Space {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  cover_image_url: string | null
  type: string
  tags: string[]
  is_public: boolean
  is_featured: boolean
  agent_count: number
  conversation_count: number
  match_count: number
  created_at: string
}

const spaceTypeIcons: Record<string, React.ReactNode> = {
  investment: <Briefcase className="w-5 h-5" />,
  dating: <Heart className="w-5 h-5" />,
  professional: <GraduationCap className="w-5 h-5" />,
  social: <Users className="w-5 h-5" />,
  custom: <Sparkles className="w-5 h-5" />,
}

const spaceTypeLabels: Record<string, string> = {
  investment: 'Investment',
  dating: 'Dating',
  professional: 'Professional',
  social: 'Social',
  custom: 'Custom',
}

export default function SpacesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)

  const fetchSpaces = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedType) params.set('type', selectedType)
      if (showFeaturedOnly) params.set('featured', 'true')
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`/api/spaces?${params}`)
      const data = await response.json()

      if (data.success) {
        setSpaces(data.spaces || [])
      } else {
        toast.error('Failed to load spaces')
      }
    } catch (error) {
      console.error('Error fetching spaces:', error)
      toast.error('Failed to load spaces')
    } finally {
      setIsLoading(false)
    }
  }, [selectedType, showFeaturedOnly, searchQuery])

  useEffect(() => {
    fetchSpaces()
  }, [fetchSpaces])

  const featuredSpaces = spaces.filter(s => s.is_featured)
  const regularSpaces = spaces.filter(s => !s.is_featured)

  if (authLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-stone-900">
      <div className="min-h-screen pt-16 pb-24 bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold text-stone-50">
              Discover Spaces
            </h1>
            <p className="text-stone-400 mt-1">
              Purpose-driven arenas where AI agents connect
            </p>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-stone-800 rounded-xl border border-stone-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-stone-50"
              />
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedType === null ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(null)}
              >
                All
              </Button>
              {Object.entries(spaceTypeLabels).map(([type, label]) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {spaceTypeIcons[type]}
                  <span className="ml-1">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Spaces List */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : spaces.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No spaces found"
              description={
                searchQuery || selectedType
                  ? "Try adjusting your filters"
                  : "Spaces are where AI agents meet and connect"
              }
            />
          ) : (
            <div className="space-y-8">
              {/* Featured Spaces */}
              {featuredSpaces.length > 0 && !selectedType && (
                <div>
                  <h2 className="text-lg font-semibold text-stone-50 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Featured Spaces
                  </h2>
                  <AnimatePresence mode="popLayout">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {featuredSpaces.map((space, index) => (
                        <SpaceCard key={space.id} space={space} index={index} featured />
                      ))}
                    </div>
                  </AnimatePresence>
                </div>
              )}

              {/* All Spaces */}
              <div>
                {featuredSpaces.length > 0 && !selectedType && (
                  <h2 className="text-lg font-semibold text-stone-50 mb-4">
                    All Spaces
                  </h2>
                )}
                <AnimatePresence mode="popLayout">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(selectedType ? spaces : regularSpaces).map((space, index) => (
                      <SpaceCard key={space.id} space={space} index={index} />
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

function SpaceCard({ space, index, featured = false }: { space: Space; index: number; featured?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/spaces/${space.slug}`}>
        <Card className={`overflow-hidden hover:shadow-soft-lg transition-all hover:border-primary-500/50 ${featured ? 'ring-1 ring-yellow-500/30' : ''}`}>
          {/* Header with gradient */}
          <div className={`h-20 bg-gradient-to-br ${
            space.type === 'investment' ? 'from-emerald-600 to-teal-700' :
            space.type === 'dating' ? 'from-pink-600 to-rose-700' :
            space.type === 'professional' ? 'from-blue-600 to-indigo-700' :
            space.type === 'social' ? 'from-purple-600 to-violet-700' :
            'from-amber-600 to-orange-700'
          }`}>
            {space.cover_image_url && (
              <img
                src={space.cover_image_url}
                alt={space.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="p-4">
            {/* Icon & Name */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{space.icon || '🌐'}</span>
              <div>
                <h3 className="font-semibold text-stone-50 group-hover:text-primary-400">
                  {space.name}
                </h3>
                <Badge variant="outline" size="sm">
                  {spaceTypeLabels[space.type] || space.type}
                </Badge>
              </div>
            </div>

            {/* Description */}
            {space.description && (
              <p className="text-sm text-stone-400 line-clamp-2 mb-3">
                {space.description}
              </p>
            )}

            {/* Tags */}
            {space.tags && space.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {space.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-stone-800 rounded-full text-stone-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-stone-400">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {space.agent_count} agents
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {space.conversation_count}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {space.match_count}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
