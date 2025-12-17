'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  Shield,
  FileText,
  MessageCircle,
  Heart,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Card, Button, Modal } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { DatingPreferences } from '@/components/settings'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/helpers'
import { DatingPreferences as DatingPreferencesType } from '@/types/database'
import toast from 'react-hot-toast'

type SettingsSection = {
  title: string
  items: {
    icon: React.ElementType
    label: string
    description?: string
    href?: string
    action?: () => void
    rightContent?: React.ReactNode
    variant?: 'default' | 'danger'
  }[]
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut, isLoading: authLoading } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/auth/login')
    } catch (error) {
      toast.error('Failed to log out')
    } finally {
      setIsLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  const settingsSections: SettingsSection[] = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Edit Profile',
          description: 'Update your name, bio, and avatar',
          href: '/profile/edit',
        },
        {
          icon: Smartphone,
          label: 'Phone Number',
          description: user?.phone || 'Manage your phone number',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Manage notification preferences',
          action: () => toast.success('Notification settings coming soon!'),
        },
        {
          icon: Lock,
          label: 'Privacy',
          description: 'Control who can see your content',
          action: () => toast.success('Privacy settings coming soon!'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help Center',
          description: 'Get help and support',
          action: () => toast.success('Help center coming soon!'),
        },
        {
          icon: MessageCircle,
          label: 'Contact Us',
          description: 'Send us feedback or report issues',
          action: () => toast.success('Contact form coming soon!'),
        },
        {
          icon: FileText,
          label: 'Terms of Service',
          action: () => toast.success('Terms of service coming soon!'),
        },
        {
          icon: Shield,
          label: 'Privacy Policy',
          action: () => toast.success('Privacy policy coming soon!'),
        },
      ],
    },
    {
      title: 'Session',
      items: [
        {
          icon: LogOut,
          label: 'Log Out',
          description: 'Sign out of your account',
          action: () => setShowLogoutModal(true),
          variant: 'danger',
        },
      ],
    },
  ]

  if (authLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return null
  }

  return (
    <AppShell>
      <main className="min-h-screen pt-16 pb-24 bg-dark-bg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Back button */}
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-100 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Profile
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-neutral-100">
              Settings
            </h1>
            <p className="text-neutral-400 mt-1">
              Manage your account and preferences
            </p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-8">
            {settingsSections.map((section) => (
              <div key={section.title}>
                <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                  {section.title}
                </h2>
                <Card className="divide-y divide-neutral-100">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const content = (
                      <div className="flex items-center gap-4 p-4">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          item.variant === 'danger'
                            ? 'bg-red-100'
                            : 'bg-dark-elevated'
                        )}>
                          <Icon className={cn(
                            'w-5 h-5',
                            item.variant === 'danger'
                              ? 'text-tertiary-300'
                              : 'text-neutral-400'
                          )} />
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            'font-medium',
                            item.variant === 'danger'
                              ? 'text-tertiary-300'
                              : 'text-neutral-100'
                          )}>
                            {item.label}
                          </p>
                          {item.description && (
                            <p className="text-sm text-neutral-500 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.rightContent || (
                          <ChevronRight className="w-5 h-5 text-neutral-400" />
                        )}
                      </div>
                    )

                    if (item.href) {
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="block hover:bg-dark-bg transition-colors"
                        >
                          {content}
                        </Link>
                      )
                    }

                    if (item.action) {
                      return (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="w-full text-left hover:bg-dark-bg transition-colors"
                        >
                          {content}
                        </button>
                      )
                    }

                    return (
                      <div key={item.label} className="opacity-60">
                        {content}
                      </div>
                    )
                  })}
                </Card>
              </div>
            ))}
          </div>

          {/* App Version */}
          <div className="mt-12 text-center text-sm text-neutral-400">
            <p>Hapien v1.0.0</p>
            <p className="mt-1">Made with ❤️ for happy sapiens</p>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Log Out"
      >
        <p className="text-neutral-400 mb-6">
          Are you sure you want to log out of your account?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-tertiary-900/300 hover:bg-red-600"
            onClick={handleLogout}
            isLoading={isLoggingOut}
          >
            Log Out
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
