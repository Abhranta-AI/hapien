'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sessionStorage } from '@/lib/auth/sessionStorage'
import { Card, Button } from '@/components/ui'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function SessionDiagnostic() {
  const [isOpen, setIsOpen] = useState(false)
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [copied, setCopied] = useState(false)

  const runDiagnostics = async () => {
    setIsChecking(true)
    const results: any = {
      timestamp: new Date().toLocaleString(),
      checks: {}
    }

    try {
      // Check Supabase session
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      results.checks.supabase = {
        hasSession: !!session,
        email: session?.user?.email,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : null,
        error: error?.message
      }

      // Check IndexedDB
      try {
        const idbSession = await sessionStorage.getSession()
        results.checks.indexedDB = {
          hasBackup: !!idbSession,
          userId: idbSession?.user_id,
          expiresAt: idbSession?.expires_at ? new Date(idbSession.expires_at * 1000).toLocaleString() : null,
          savedAt: idbSession?.timestamp ? new Date(idbSession.timestamp).toLocaleString() : null
        }
      } catch (e: any) {
        results.checks.indexedDB = { error: e.message }
      }

      // Check localStorage
      const lsKeys = Object.keys(localStorage).filter(k => k.includes('hapien') || k.includes('supabase'))
      results.checks.localStorage = {
        keyCount: lsKeys.length,
        keys: lsKeys
      }

      // Check cookies
      const cookies = document.cookie.split(';').filter(c =>
        c.includes('hapien') || c.includes('supabase') || c.includes('sb-')
      ).map(c => c.split('=')[0].trim())
      results.checks.cookies = {
        count: cookies.length,
        names: cookies
      }

    } catch (e: any) {
      results.error = e.message
    }

    setDiagnostics(results)
    setIsChecking(false)
  }

  const generateReport = () => {
    if (!diagnostics) return ''

    return `
🔍 HAPIEN SESSION DIAGNOSTIC REPORT
Generated: ${diagnostics.timestamp}

📊 SUMMARY:
${diagnostics.checks.supabase?.hasSession ? '✅' : '❌'} Supabase Session
${diagnostics.checks.indexedDB?.hasBackup ? '✅' : '❌'} IndexedDB Backup
${diagnostics.checks.localStorage?.keyCount > 0 ? '✅' : '❌'} LocalStorage (${diagnostics.checks.localStorage?.keyCount || 0} keys)
${diagnostics.checks.cookies?.count > 0 ? '✅' : '❌'} Cookies (${diagnostics.checks.cookies?.count || 0})

📧 SUPABASE SESSION:
Email: ${diagnostics.checks.supabase?.email || 'N/A'}
Expires At: ${diagnostics.checks.supabase?.expiresAt || 'N/A'}
${diagnostics.checks.supabase?.error ? `Error: ${diagnostics.checks.supabase.error}` : ''}

💾 INDEXEDDB BACKUP:
Has Backup: ${diagnostics.checks.indexedDB?.hasBackup ? 'Yes' : 'No'}
User ID: ${diagnostics.checks.indexedDB?.userId || 'N/A'}
Saved At: ${diagnostics.checks.indexedDB?.savedAt || 'N/A'}
Expires At: ${diagnostics.checks.indexedDB?.expiresAt || 'N/A'}
${diagnostics.checks.indexedDB?.error ? `Error: ${diagnostics.checks.indexedDB.error}` : ''}

💽 LOCALSTORAGE:
Keys Found: ${diagnostics.checks.localStorage?.keys?.join(', ') || 'None'}

🍪 COOKIES:
Names: ${diagnostics.checks.cookies?.names?.join(', ') || 'None'}

---
Device: ${navigator.userAgent}
Time: ${new Date().toISOString()}
    `.trim()
  }

  const shareReport = async () => {
    const text = generateReport()

    // Check if Web Share API is available (iOS Safari supports this)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hapien Session Diagnostic',
          text: text
        })
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err: any) {
        // User cancelled or error occurred
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err)
          // Fallback to copy
          copyToClipboard(text)
        }
      }
    } else {
      // Fallback to copy for desktop
      copyToClipboard(text)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback: try to use the old method
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {
        console.error('Fallback copy failed:', e)
      }
      document.body.removeChild(textArea)
    }
  }

  useEffect(() => {
    if (isOpen && !diagnostics) {
      runDiagnostics()
    }
  }, [isOpen])

  if (!isOpen) {
    return (
      <div className="fixed bottom-24 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          variant="primary"
          className="shadow-2xl bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3"
        >
          🔍 Debug Session
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 w-80 max-h-96 overflow-y-auto">
      <Card variant="elevated" padding="sm" className="bg-stone-800 border border-stone-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-stone-50 text-sm">🔍 Session Debug</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-stone-400 hover:text-stone-300"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <Button
            onClick={runDiagnostics}
            size="sm"
            className="flex-1"
            disabled={isChecking}
          >
            {isChecking ? '⏳ Checking...' : '🔄 Refresh'}
          </Button>
          <Button
            onClick={shareReport}
            size="sm"
            variant="secondary"
            className="flex-1"
            disabled={!diagnostics}
          >
            {copied ? '✅ Shared!' : '📤 Share'}
          </Button>
        </div>

        {diagnostics && (
          <div className="space-y-2 text-xs">
            <div className="text-stone-500">
              {diagnostics.timestamp}
            </div>

            {/* Summary */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={diagnostics.checks.supabase?.hasSession ? 'text-green-400' : 'text-red-400'}>
                  {diagnostics.checks.supabase?.hasSession ? '✅' : '❌'}
                </span>
                <span className="text-stone-300">Supabase Session</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={diagnostics.checks.indexedDB?.hasBackup ? 'text-green-400' : 'text-red-400'}>
                  {diagnostics.checks.indexedDB?.hasBackup ? '✅' : '❌'}
                </span>
                <span className="text-stone-300">IndexedDB Backup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={diagnostics.checks.localStorage?.keyCount > 0 ? 'text-green-400' : 'text-red-400'}>
                  {diagnostics.checks.localStorage?.keyCount > 0 ? '✅' : '❌'}
                </span>
                <span className="text-stone-300">LocalStorage ({diagnostics.checks.localStorage?.keyCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={diagnostics.checks.cookies?.count > 0 ? 'text-green-400' : 'text-red-400'}>
                  {diagnostics.checks.cookies?.count > 0 ? '✅' : '❌'}
                </span>
                <span className="text-stone-300">Cookies ({diagnostics.checks.cookies?.count})</span>
              </div>
            </div>

            {/* Details */}
            {diagnostics.checks.supabase?.email && (
              <div className="mt-2 pt-2 border-t border-stone-700">
                <div className="text-stone-400">Email:</div>
                <div className="text-stone-300">{diagnostics.checks.supabase.email}</div>
              </div>
            )}

            {diagnostics.checks.supabase?.expiresAt && (
              <div className="mt-1">
                <div className="text-stone-400">Expires:</div>
                <div className="text-stone-300 text-xs">{diagnostics.checks.supabase.expiresAt}</div>
              </div>
            )}

            {diagnostics.checks.indexedDB?.savedAt && (
              <div className="mt-1">
                <div className="text-stone-400">IDB Saved:</div>
                <div className="text-stone-300 text-xs">{diagnostics.checks.indexedDB.savedAt}</div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-stone-700 text-stone-500 text-xs">
              💡 Tap "Share" to share via WhatsApp, Email, Messages, etc.
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
