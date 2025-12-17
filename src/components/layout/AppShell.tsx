'use client'

import { ReactNode } from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { cn } from '@/utils/helpers'

interface AppShellProps {
  children: ReactNode
  showHeader?: boolean
  showNav?: boolean
  headerTitle?: string
  className?: string
  contentClassName?: string
}

export function AppShell({
  children,
  showHeader = true,
  showNav = true,
  headerTitle,
  className,
  contentClassName,
}: AppShellProps) {
  return (
    <div className={cn('min-h-screen bg-stone-50', className)}>
      {showHeader && <Header title={headerTitle} />}
      
      <main
        className={cn(
          'max-w-4xl mx-auto px-4 py-6',
          showNav && 'pb-24 lg:pb-6',
          contentClassName
        )}
      >
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}
