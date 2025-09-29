import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Auth callback handler for email confirmations and OAuth redirects
 * This route handles:
 * - Email verification after registration
 * - Password reset confirmations
 * - OAuth provider callbacks (if needed in future)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle authentication errors
  if (error) {
    console.error('Auth callback error:', error, errorDescription)

    let redirectUrl: string
    let errorMessage: string

    switch (error) {
      case 'access_denied':
        errorMessage = 'Akses ditolak. Silakan coba lagi.'
        redirectUrl = `/auth/login?error=${encodeURIComponent(errorMessage)}`
        break
      case 'invalid_request':
        errorMessage = 'Permintaan tidak valid. Link mungkin sudah kedaluwarsa.'
        redirectUrl = `/auth/login?error=${encodeURIComponent(errorMessage)}`
        break
      case 'unauthorized_client':
        errorMessage = 'Klien tidak diotorisasi.'
        redirectUrl = `/auth/login?error=${encodeURIComponent(errorMessage)}`
        break
      default:
        errorMessage = errorDescription || 'Terjadi kesalahan autentikasi.'
        redirectUrl = `/auth/login?error=${encodeURIComponent(errorMessage)}`
    }

    return NextResponse.redirect(new URL(redirectUrl, origin))
  }

  // Handle missing authorization code
  if (!code) {
    const errorMessage = 'Kode otorisasi tidak ditemukan. Silakan coba lagi.'
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorMessage)}`, origin)
    )
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    // Create Supabase client for server-side auth handling
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
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

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)

      let errorMessage: string
      switch (exchangeError.message) {
        case 'Invalid authorization code':
          errorMessage = 'Kode otorisasi tidak valid. Link mungkin sudah kedaluwarsa.'
          break
        case 'Code challenge required':
          errorMessage = 'Verifikasi kode diperlukan.'
          break
        default:
          errorMessage = 'Gagal memverifikasi email. Silakan coba lagi.'
      }

      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(errorMessage)}`, origin)
      )
    }

    if (!data.session || !data.user) {
      const errorMessage = 'Gagal membuat sesi. Silakan coba login ulang.'
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(errorMessage)}`, origin)
      )
    }

    // Check if this is email verification or password reset
    const user = data.user
    const isEmailVerification = user.email_confirmed_at && !user.last_sign_in_at
    const isPasswordReset = searchParams.get('type') === 'recovery'

    // For email verification, check if member profile exists
    if (isEmailVerification) {
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id, status')
          .eq('user_id', user.id)
          .single()

        if (memberError && memberError.code !== 'PGRST116') {
          console.error('Error checking member data:', memberError)
        }

        if (!memberData) {
          // User verified email but no member profile - redirect to complete profile
          supabaseResponse = NextResponse.redirect(new URL('/auth/complete-profile', origin))
        } else if (memberData.status !== 'active') {
          // Member exists but not active - redirect to account status
          supabaseResponse = NextResponse.redirect(new URL('/auth/account-status', origin))
        } else {
          // Member is active - redirect to dashboard with success message
          supabaseResponse = NextResponse.redirect(
            new URL(`/?message=${encodeURIComponent('Email berhasil diverifikasi!')}`, origin)
          )
        }
      } catch (error) {
        console.error('Error in member check:', error)
        // Fallback to complete profile page
        supabaseResponse = NextResponse.redirect(new URL('/auth/complete-profile', origin))
      }
    } else if (isPasswordReset) {
      // Password reset - redirect to reset password page
      supabaseResponse = NextResponse.redirect(new URL('/auth/reset-password', origin))
    } else {
      // Regular login flow - redirect to intended destination
      const redirectUrl = next.startsWith('/') ? next : '/'
      supabaseResponse = NextResponse.redirect(new URL(redirectUrl, origin))
    }

    return supabaseResponse

  } catch (error) {
    console.error('Unexpected error in auth callback:', error)

    const errorMessage = 'Terjadi kesalahan sistem. Silakan coba lagi.'
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorMessage)}`, origin)
    )
  }
}

/**
 * Handle POST requests for manual session refresh (if needed)
 */
export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
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

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to refresh session', details: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        message: 'Session refreshed successfully',
        user: data.user,
        session: data.session
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in POST auth callback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}