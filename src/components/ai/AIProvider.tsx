'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AIChatBubble } from './AIChatBubble'
import { AIChatDrawer } from './AIChatDrawer'

// Pages where AI bubble should NOT appear
const EXCLUDED_PATHS = [
  '/',           // Landing page
  '/auth',       // Auth pages
  '/onboarding', // Onboarding
]

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const pathname = usePathname()

  // Check if we should show the AI bubble
  const shouldShowAI = !EXCLUDED_PATHS.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  )

  return (
    <>
      {children}

      {/* AI Chat Bubble - only show on authenticated pages */}
      {shouldShowAI && (
        <>
          <AIChatBubble
            onClick={() => setIsChatOpen(true)}
            hasUnread={false}
          />
          <AIChatDrawer
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </>
      )}
    </>
  )
}
