'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sessionStorage } from '@/lib/auth/sessionStorage'
import { Card, Button } from '@/components/ui'
import { AppShell } from '@/components/layout'

export default function DebugSessionPage() {
  const [logs, setLogs] = useState<string[]>(['Initializing diagnostic...'])
  const [session, setSession] = useState<any>(null)
  const [indexedDBSession, setIndexedDBSession] = useState<any>(null)
  const [localStorageData, setLocalStorageData] = useState<any>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
    console.log(message)
  }

  const checkSession = async () => {
    setLogs([])
    addLog('=== SESSION DIAGNOSTIC START ===')

    // Check Supabase session
    addLog('Checking Supabase session...')
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      addLog(`❌ Error getting session: ${error.message}`)
    } else if (data.session) {
      addLog(`✅ Supabase session found`)
      addLog(`   User: ${data.session.user?.email}`)
      addLog(`   Expires: ${new Date(data.session.expires_at! * 1000).toLocaleString()}`)
      setSession(data.session)
    } else {
      addLog('❌ No Supabase session found')
    }

    // Check IndexedDB
    addLog('Checking IndexedDB...')
    try {
      const idbSession = await sessionStorage.getSession()
      if (idbSession) {
        addLog(`✅ IndexedDB session found`)
        addLog(`   User ID: ${idbSession.user_id}`)
        addLog(`   Expires: ${new Date(idbSession.expires_at * 1000).toLocaleString()}`)
        addLog(`   Saved: ${new Date(idbSession.timestamp).toLocaleString()}`)
        setIndexedDBSession(idbSession)
      } else {
        addLog('❌ No IndexedDB session found')
      }
    } catch (e: any) {
      addLog(`❌ IndexedDB error: ${e.message}`)
    }

    // Check localStorage
    addLog('Checking localStorage...')
    try {
      const keys = Object.keys(localStorage).filter(k => k.includes('hapien') || k.includes('supabase'))
      if (keys.length > 0) {
        addLog(`✅ Found ${keys.length} relevant localStorage keys:`)
        const lsData: any = {}
        keys.forEach(key => {
          const value = localStorage.getItem(key)
          lsData[key] = value
          addLog(`   - ${key}: ${value?.substring(0, 50)}...`)
        })
        setLocalStorageData(lsData)
      } else {
        addLog('❌ No relevant localStorage keys found')
      }
    } catch (e: any) {
      addLog(`❌ localStorage error: ${e.message}`)
    }

    // Check cookies
    addLog('Checking cookies...')
    const allCookies = document.cookie.split(';').map(c => c.trim())
    const relevantCookies = allCookies.filter(c =>
      c.includes('hapien') || c.includes('supabase') || c.includes('sb-')
    )
    if (relevantCookies.length > 0) {
      addLog(`✅ Found ${relevantCookies.length} relevant cookies:`)
      relevantCookies.forEach(cookie => {
        const [name] = cookie.split('=')
        addLog(`   - ${name}`)
      })
      setCookies(relevantCookies)
    } else {
      addLog('❌ No relevant cookies found')
    }

    addLog('=== SESSION DIAGNOSTIC END ===')
  }

  useEffect(() => {
    if (isClient) {
      checkSession()
    }
  }, [isClient])

  if (!isClient) {
    return (
      <div className="min-h-screen pt-20 pb-24 bg-stone-900 flex items-center justify-center">
        <p className="text-stone-400">Loading diagnostic...</p>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen pt-20 pb-24 bg-stone-900">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Card variant="elevated" padding="lg" className="bg-stone-800 border border-stone-700">
            <h1 className="text-2xl font-bold text-stone-50 mb-4">
              🔍 Session Debug Info
            </h1>

            <p className="text-stone-400 mb-4 text-sm">
              This page helps diagnose why sessions aren't persisting on iOS PWA.
            </p>

            <Button
              onClick={checkSession}
              className="mb-6 bg-violet-600 hover:bg-violet-700 text-white font-semibold"
              size="lg"
            >
              🔄 Refresh Diagnostic
            </Button>

            <div className="space-y-6">
              {/* Logs */}
              <div>
                <h2 className="text-lg font-semibold text-stone-50 mb-3">📋 Diagnostic Logs</h2>
                <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-stone-500">No logs yet. Click "Refresh Diagnostic" to run checks.</div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className={log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : 'text-stone-300'}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Session Data */}
              {session && (
                <div>
                  <h2 className="text-lg font-semibold text-stone-50 mb-3">✅ Current Session</h2>
                  <div className="bg-stone-900 border border-stone-700 rounded-lg p-4">
                    <pre className="text-xs text-stone-300 overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(session, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* IndexedDB Data */}
              {indexedDBSession && (
                <div>
                  <h2 className="text-lg font-semibold text-stone-50 mb-3">💾 IndexedDB Backup</h2>
                  <div className="bg-stone-900 border border-stone-700 rounded-lg p-4">
                    <pre className="text-xs text-stone-300 overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(indexedDBSession, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-stone-900 border border-stone-700 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-stone-50 mb-3">📊 Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={session ? 'text-green-400' : 'text-red-400'}>
                      {session ? '✅' : '❌'}
                    </span>
                    <span className="text-stone-300">Supabase Session</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={indexedDBSession ? 'text-green-400' : 'text-red-400'}>
                      {indexedDBSession ? '✅' : '❌'}
                    </span>
                    <span className="text-stone-300">IndexedDB Backup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={localStorageData && Object.keys(localStorageData).length > 0 ? 'text-green-400' : 'text-red-400'}>
                      {localStorageData && Object.keys(localStorageData).length > 0 ? '✅' : '❌'}
                    </span>
                    <span className="text-stone-300">LocalStorage Data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cookies.length > 0 ? 'text-green-400' : 'text-red-400'}>
                      {cookies.length > 0 ? '✅' : '❌'}
                    </span>
                    <span className="text-stone-300">Cookies</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
