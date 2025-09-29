import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Protected routes that require authentication
 * These routes will redirect to login if user is not authenticated
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/savings',
  '/loans',
  '/transactions',
  '/profile',
  '/notifications',
  '/settings',
] as const

/**
 * API routes that require authentication
 */
const PROTECTED_API_ROUTES = [
  '/api/member',
  '/api/savings',
  '/api/loans',
  '/api/transactions',
  '/api/notifications',
  '/api/profile',
] as const

/**
 * Auth routes that should redirect to dashboard if user is already authenticated
 */
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
] as const

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/auth/verify',
  '/auth/reset-password',
  '/auth/callback',
  '/offline',
  '/privacy',
  '/terms',
  '/contact',
] as const

/**
 * Static file patterns that should be excluded from middleware
 */
const STATIC_FILE_PATTERNS = [
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/robots.txt',
  '/sitemap.xml',
] as const

/**
 * Helper function to check if a path matches any pattern in an array
 */
function matchesPattern(pathname: string, patterns: readonly string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1))
    }
    return pathname === pattern || pathname.startsWith(pattern + '/')
  })
}

/**
 * Helper function to determine if a path is a static file
 */
function isStaticFile(pathname: string): boolean {
  return (
    // Static file extensions
    /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif|mp4|webm)$/i.test(pathname) ||
    // Next.js static files
    pathname.startsWith('/_next/') ||
    // Specific static files
    STATIC_FILE_PATTERNS.includes(pathname) ||
    // API health check
    pathname === '/api/health'
  )
}

/**
 * Update session with Supabase client
 */
async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware')
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set secure cookies for production
            const secureOptions: CookieOptions = {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              httpOnly: true,
              path: '/',
            }
            request.cookies.set(name, value, secureOptions)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            const secureOptions: CookieOptions = {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              httpOnly: true,
              path: '/',
            }
            supabaseResponse.cookies.set(name, value, secureOptions)
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Error refreshing session in middleware:', error)
    // Clear invalid session cookies
    supabaseResponse.cookies.delete('supabase-auth-token')
    supabaseResponse.cookies.delete('koperasi-sinoman-auth')
  }

  return { response: supabaseResponse, session, supabase }
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Skip middleware for static files and certain paths
  if (isStaticFile(pathname)) {
    return NextResponse.next()
  }

  try {
    const { response, session, supabase } = await updateSession(request)

    // Check if user has a member record for protected routes
    let memberData = null
    if (session && matchesPattern(pathname, PROTECTED_ROUTES)) {
      try {
        const { data } = await supabase
          .from('members')
          .select('id, status')
          .eq('user_id', session.user.id)
          .single()

        memberData = data
      } catch (error) {
        console.error('Error checking member status in middleware:', error)
      }
    }

    // Handle protected routes
    if (matchesPattern(pathname, PROTECTED_ROUTES)) {
      if (!session) {
        // Not authenticated - redirect to login
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
      }

      if (!memberData) {
        // Authenticated but no member record - redirect to complete profile
        const completeProfileUrl = new URL('/auth/complete-profile', request.url)
        return NextResponse.redirect(completeProfileUrl)
      }

      if (memberData.status !== 'active') {
        // Member account is not active - redirect to account status page
        const accountStatusUrl = new URL('/auth/account-status', request.url)
        return NextResponse.redirect(accountStatusUrl)
      }
    }

    // Handle protected API routes
    if (matchesPattern(pathname, PROTECTED_API_ROUTES)) {
      if (!session) {
        return new NextResponse(
          JSON.stringify({
            error: 'Unauthorized',
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      if (!memberData) {
        return new NextResponse(
          JSON.stringify({
            error: 'Member Not Found',
            message: 'Member profile not found',
            code: 'MEMBER_NOT_FOUND'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      if (memberData.status !== 'active') {
        return new NextResponse(
          JSON.stringify({
            error: 'Account Inactive',
            message: 'Member account is not active',
            code: 'ACCOUNT_INACTIVE'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Handle auth routes (redirect to dashboard if already authenticated)
    if (matchesPattern(pathname, AUTH_ROUTES)) {
      if (session && memberData && memberData.status === 'active') {
        const redirectTo = searchParams.get('redirectTo')
        if (redirectTo && !redirectTo.startsWith('/auth/')) {
          return NextResponse.redirect(new URL(redirectTo, request.url))
        }
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // Handle root route - redirect authenticated users to dashboard
    if (pathname === '/') {
      if (session && memberData && memberData.status === 'active') {
        // User is authenticated and active - keep them on the dashboard
        return response
      }
      if (session && !memberData) {
        // User is authenticated but no member record
        return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
      }
      if (session && memberData?.status !== 'active') {
        // User has member record but account is not active
        return NextResponse.redirect(new URL('/auth/account-status', request.url))
      }
    }

    // Add security headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', pathname)
    requestHeaders.set('x-search-params', searchParams.toString())

    // Add session info to headers for server components
    if (session) {
      requestHeaders.set('x-user-id', session.user.id)
      if (memberData) {
        requestHeaders.set('x-member-id', memberData.id)
        requestHeaders.set('x-member-status', memberData.status)
      }
    }

    // Update response with headers
    const modifiedResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Copy cookies from the original response
    response.cookies.getAll().forEach(cookie => {
      modifiedResponse.cookies.set(cookie)
    })

    return modifiedResponse

  } catch (error) {
    console.error('Middleware error:', error)

    // For API routes, return JSON error
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
          code: 'MIDDLEWARE_ERROR'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // For page routes, redirect to error page or continue
    if (matchesPattern(pathname, PROTECTED_ROUTES)) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return NextResponse.next()
  }
}

/**
 * Matcher configuration to run middleware only on necessary paths
 * This optimizes performance by excluding static files and irrelevant routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf|eot)$).*)',
    /*
     * Always run for API routes
     */
    '/api/(.*)',
    /*
     * Always run for auth routes
     */
    '/auth/(.*)',
    /*
     * Always run for protected routes
     */
    '/(dashboard|savings|loans|transactions|profile|notifications|settings)/:path*',
  ],
}