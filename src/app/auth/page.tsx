'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to login page
    router.replace('/auth/login')
  }, [router])
  
  return null
}
