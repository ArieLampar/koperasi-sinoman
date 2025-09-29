import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Email confirmation route handler using Supabase verifyOtp
 * This route handles:
 * - Email verification after registration
 * - OTP confirmation for password reset
 * - Magic link confirmations
 * - Phone number verification (future)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')
  const type = searchParams.get('type') || 'email'
  const email = searchParams.get('email')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle confirmation errors from Supabase
  if (error) {
    console.error('Email confirmation error:', error, errorDescription)

    let redirectUrl: string
    let errorMessage: string

    switch (error) {
      case 'access_denied':
        errorMessage = 'Akses ditolak. Link konfirmasi mungkin tidak valid.'
        redirectUrl = `/auth/login?error=${encodeURIComponent(errorMessage)}`
        break
      case 'invalid_request':
        errorMessage = 'Link konfirmasi tidak valid atau sudah kedaluwarsa.'
        redirectUrl = `/auth/login?error=${encodeURIComponent(errorMessage)}`
        break
      case 'unauthorized_client':
        errorMessage = 'Klien tidak diotorisasi untuk mengakses link ini.'
        redirectUrl = `/auth/login?error=${encodeURIComponent(errorMessage)}`
        break
      case 'server_error':
        errorMessage = 'Terjadi kesalahan server. Silakan coba lagi.'
        redirectUrl = `/auth/login?error=${encodeURIComponent(errorMessage)}`
        break
      default:
        errorMessage = errorDescription || 'Terjadi kesalahan konfirmasi email.'
        redirectUrl = `/auth/login?error=${encodeURIComponent(errorMessage)}`
    }

    return NextResponse.redirect(new URL(redirectUrl, origin))
  }

  // Handle missing token
  if (!token) {
    const errorMessage = 'Token konfirmasi tidak ditemukan. Silakan coba lagi.'
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorMessage)}`, origin)
    )
  }

  // Handle missing email for certain confirmation types
  if ((type === 'email' || type === 'signup') && !email) {
    const errorMessage = 'Email tidak ditemukan dalam link konfirmasi.'
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

    // Verify the OTP token
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any, // Type assertion for Supabase OTP types
    })

    if (verifyError) {
      console.error('OTP verification error:', verifyError)

      let errorMessage: string
      let redirectPath = '/auth/login'

      switch (verifyError.message) {
        case 'Token has expired':
          errorMessage = 'Link konfirmasi sudah kedaluwarsa. Silakan minta link baru.'
          redirectPath = type === 'recovery' ? '/auth/forgot-password' : '/auth/login'
          break
        case 'Invalid token':
          errorMessage = 'Token konfirmasi tidak valid. Pastikan Anda menggunakan link terbaru.'
          break
        case 'Token already used':
          errorMessage = 'Link konfirmasi sudah pernah digunakan.'
          break
        case 'Email not found':
          errorMessage = 'Email tidak ditemukan dalam sistem.'
          break
        default:
          errorMessage = 'Gagal memverifikasi email. Silakan coba lagi atau hubungi support.'
      }

      return NextResponse.redirect(
        new URL(`${redirectPath}?error=${encodeURIComponent(errorMessage)}`, origin)
      )
    }

    if (!data.user || !data.session) {
      const errorMessage = 'Gagal membuat sesi setelah konfirmasi. Silakan coba login ulang.'
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(errorMessage)}`, origin)
      )
    }

    const user = data.user

    // Handle different confirmation types
    switch (type) {
      case 'signup':
      case 'email':
        // Email verification after registration
        try {
          // Check if this is a new email confirmation (first time)
          const isNewConfirmation = !user.email_confirmed_at ||
            new Date(user.email_confirmed_at) > new Date(Date.now() - 60000) // Confirmed within last minute

          if (isNewConfirmation) {
            // Process registration data and create member profile
            const registrationData = user.user_metadata?.registration_data

            if (registrationData) {
              // Create member profile in database
              const memberData = {
                user_id: user.id,
                full_name: user.user_metadata?.full_name || '',
                email: user.email!,
                phone: user.user_metadata?.phone || '',
                date_of_birth: registrationData.personal?.date_of_birth,
                gender: registrationData.personal?.gender,
                id_number: registrationData.personal?.id_number,
                id_type: registrationData.personal?.id_type,
                address: registrationData.personal?.address,
                city: registrationData.personal?.city,
                postal_code: registrationData.personal?.postal_code,
                occupation: registrationData.personal?.occupation,
                monthly_income: registrationData.personal?.monthly_income,
                status: 'pending_verification', // Will be reviewed by admin
                kyc_status: 'pending',
                kyc_documents: registrationData.kyc_documents || {},
                referral_code: registrationData.referral_code,
                marketing_consent: registrationData.marketing_consent || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }

              const { data: memberProfile, error: memberError } = await supabase
                .from('members')
                .insert(memberData)
                .select('id, status, kyc_status')
                .single()

              if (memberError) {
                console.error('Error creating member profile:', memberError)

                // If member already exists, fetch existing profile
                if (memberError.code === '23505') { // Unique constraint violation
                  const { data: existingMember } = await supabase
                    .from('members')
                    .select('id, status, kyc_status')
                    .eq('user_id', user.id)
                    .single()

                  if (existingMember) {
                    return handleMemberRedirect(existingMember, origin, supabaseResponse)
                  }
                }

                // Fallback to complete profile page if member creation fails
                supabaseResponse = NextResponse.redirect(
                  new URL('/auth/complete-profile?error=member_creation_failed', origin)
                )
                return supabaseResponse
              }

              // Create initial savings account if specified
              if (registrationData.savings && memberProfile) {
                try {
                  const savingsData = {
                    member_id: memberProfile.id,
                    account_type: registrationData.savings.type,
                    balance: 0, // Will be updated after payment verification
                    status: 'pending',
                    auto_debit: registrationData.savings.auto_debit || false,
                    auto_debit_amount: registrationData.savings.auto_debit_amount,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }

                  await supabase
                    .from('savings_accounts')
                    .insert(savingsData)

                  // Create initial deposit transaction record
                  if (registrationData.savings.initial_deposit > 0) {
                    const transactionData = {
                      member_id: memberProfile.id,
                      type: 'deposit',
                      amount: registrationData.savings.initial_deposit,
                      description: 'Setoran awal pendaftaran',
                      status: 'pending',
                      reference_number: `REG-${Date.now()}-${memberProfile.id}`,
                      created_at: new Date().toISOString(),
                    }

                    await supabase
                      .from('transactions')
                      .insert(transactionData)
                  }
                } catch (savingsError) {
                  console.error('Error creating savings account:', savingsError)
                  // Continue with the flow even if savings creation fails
                }
              }

              return handleMemberRedirect(memberProfile, origin, supabaseResponse)
            } else {
              // No registration data found, redirect to complete profile
              supabaseResponse = NextResponse.redirect(
                new URL('/auth/complete-profile', origin)
              )
              return supabaseResponse
            }
          } else {
            // Existing user email confirmation, check member status
            const { data: memberData } = await supabase
              .from('members')
              .select('id, status, kyc_status')
              .eq('user_id', user.id)
              .single()

            if (memberData) {
              return handleMemberRedirect(memberData, origin, supabaseResponse)
            } else {
              supabaseResponse = NextResponse.redirect(
                new URL('/auth/complete-profile', origin)
              )
              return supabaseResponse
            }
          }
        } catch (error) {
          console.error('Error in email confirmation processing:', error)
          supabaseResponse = NextResponse.redirect(
            new URL('/auth/complete-profile?error=processing_failed', origin)
          )
          return supabaseResponse
        }
        break

      case 'recovery':
        // Password reset confirmation
        supabaseResponse = NextResponse.redirect(
          new URL('/auth/reset-password', origin)
        )
        return supabaseResponse

      case 'magiclink':
        // Magic link login
        const redirectUrl = next.startsWith('/') ? next : '/'
        supabaseResponse = NextResponse.redirect(new URL(redirectUrl, origin))
        return supabaseResponse

      default:
        // Unknown confirmation type
        console.warn('Unknown confirmation type:', type)
        supabaseResponse = NextResponse.redirect(
          new URL(`/auth/login?message=${encodeURIComponent('Email berhasil dikonfirmasi!')}`, origin)
        )
        return supabaseResponse
    }

  } catch (error) {
    console.error('Unexpected error in email confirmation:', error)

    const errorMessage = 'Terjadi kesalahan sistem. Silakan coba lagi atau hubungi support.'
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorMessage)}`, origin)
    )
  }
}

/**
 * Handle member redirect based on their status and KYC verification
 */
function handleMemberRedirect(
  member: { id: number; status: string; kyc_status: string },
  origin: string,
  response: NextResponse
): NextResponse {
  switch (member.status) {
    case 'pending_verification':
      // Member created but KYC pending review
      return NextResponse.redirect(
        new URL('/auth/account-status?status=pending_verification', origin)
      )

    case 'pending_payment':
      // KYC approved but initial payment pending
      return NextResponse.redirect(
        new URL('/auth/account-status?status=pending_payment', origin)
      )

    case 'active':
      // Member is active, redirect to dashboard with success message
      return NextResponse.redirect(
        new URL('/?message=' + encodeURIComponent('Selamat datang! Akun Anda sudah aktif.'), origin)
      )

    case 'suspended':
      // Account suspended
      return NextResponse.redirect(
        new URL('/auth/account-status?status=suspended', origin)
      )

    case 'rejected':
      // KYC or application rejected
      return NextResponse.redirect(
        new URL('/auth/account-status?status=rejected', origin)
      )

    default:
      // Unknown status, redirect to account status page
      return NextResponse.redirect(
        new URL('/auth/account-status?status=unknown', origin)
      )
  }
}

/**
 * Handle POST requests for manual OTP verification (if needed in future)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, token, type = 'email' } = await request.json()

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
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

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: type as any,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Email confirmed successfully',
        user: data.user,
        session: data.session
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in POST email confirmation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}