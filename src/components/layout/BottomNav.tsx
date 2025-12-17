'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, User } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { motion } from 'framer-motion'

const navItems = [
  {
    label: 'Home',
    href: '/feed',
    icon: Home,
  },
  {
    label: 'Communities',
    href: '/communities',
    icon: Users,
  },
  {
    label: 'Hangouts',
    href: '/hangouts',
    icon: Calendar,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-stone-200 pb-safe lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 h-full"
            >
              <div
                className={cn(
                  'flex flex-col items-center gap-1 transition-colors duration-200',
                  isActive ? 'text-amber-600' : 'text-stone-400'
                )}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
