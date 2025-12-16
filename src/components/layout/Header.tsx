'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Bell, Search, Plus, Users } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/utils/helpers'

interface HeaderProps {
  showBack?: boolean
  title?: string
  showSearch?: boolean
  showNotifications?: boolean
  showCreateButton?: boolean
  transparent?: boolean
}

export function Header({
  showBack = false,
  title,
  showSearch = true,
  showNotifications = true,
  showCreateButton = true,
  transparent = false,
}: HeaderProps) {
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const pathname = usePathname()

  const isHome = pathname === '/feed'

  return (
    <header
      className={cn(
        'sticky top-0 z-30 px-4 py-3',
        transparent
          ? 'bg-transparent'
          : 'bg-dark-card/90 backdrop-blur-lg border-b border-dark-border'
      )}
    >
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {isHome ? (
            <Link href="/feed" className="flex items-center gap-2">
              <div className="w-9 h-9 relative">
                <Image
                  src="/logo.png"
                  alt="Hapien Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display text-xl font-bold text-neutral-100 hidden sm:block">
                Hapien
              </span>
            </Link>
          ) : (
            <h1 className="font-display text-xl font-semibold text-neutral-100">
              {title || 'Hapien'}
            </h1>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <Link
              href="/search"
              className="p-2.5 text-neutral-500 hover:text-neutral-300 hover:bg-dark-elevated rounded-xl transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>
          )}

          {showNotifications && (
            <Link
              href="/notifications"
              className="relative p-2.5 text-neutral-500 hover:text-neutral-300 hover:bg-dark-elevated rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {/* Notification badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-tertiary-500 text-white text-xs font-bold rounded-full px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {showCreateButton && (
            <Link
              href="/create"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white font-medium rounded-xl hover:shadow-glow transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Create</span>
            </Link>
          )}

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            <NavLink href="/feed">Home</NavLink>
            <NavLink href="/communities">Communities</NavLink>
            <NavLink href="/hangouts">Hangouts</NavLink>
          </nav>

          {/* Profile avatar */}
          <Link href="/profile" className="ml-2">
            <Avatar
              src={user?.avatar_url}
              name={user?.name || 'User'}
              size="sm"
            />
          </Link>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-xl transition-colors',
        isActive
          ? 'text-primary-400 bg-primary-900/30'
          : 'text-neutral-400 hover:text-neutral-100 hover:bg-dark-elevated'
      )}
    >
      {children}
    </Link>
  )
}
