import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Enhanced cookie options for PWA/mobile persistence
          const cookieOptions = {
            ...options,
            sameSite: 'lax' as const,
            secure: true,
            path: '/',
            maxAge: 365 * 24 * 60 * 60, // 1 year
          }

          request.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          const cookieOptions = {
            ...options,
            sameSite: 'lax' as const,
            secure: true,
            path: '/',
            maxAge: 0,
          }

          request.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/callback',
  ]

  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'))

  // Allow public routes for non-authenticated users
  if (!user && isPublicRoute) {
    return response
  }

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user IS authenticated, check profile completion
  if (user) {
    // Allow access to callback (needed for email magic link flow)
    if (pathname === '/auth/callback') {
      return response
    }

    // Allow access to onboarding
    if (pathname === '/onboarding') {
      return response
    }

    // Check if profile is complete
    const { data: profile } = await (supabase
      .from('users') as any)
      .select('name')
      .eq('id', user.id)
      .single()

    // If profile is incomplete, redirect to onboarding (except if already there or on auth pages)
    if (!profile?.name && pathname !== '/onboarding' && !pathname.startsWith('/auth/')) {
      console.log('Profile incomplete, redirecting to onboarding')
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}
