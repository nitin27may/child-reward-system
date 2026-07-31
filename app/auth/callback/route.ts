import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') ?? '/'
  const next = searchParams.get('next') ?? redirect

  // Behind Vercel's proxy, request.url carries the internal deployment host,
  // so redirecting to `origin` would drop the user on a URL that isn't the one
  // they signed in from. x-forwarded-host holds the user-facing hostname.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const base = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin

  // Log for debugging
  console.log('[Auth Callback] Code present:', !!code, 'Redirect:', next)

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[Auth Callback] Exchange error:', error.message)
      return NextResponse.redirect(`${base}/auth/login?error=callback_failed&message=${encodeURIComponent(error.message)}`)
    }
    
    if (data.user) {
      console.log('[Auth Callback] User authenticated:', data.user.email)
      const userEmail = data.user.email

      // Check if this email belongs to a child
      if (userEmail) {
        const { data: childMatch } = await supabase
          .from('children')
          .select('id, family_id, name')
          .eq('email', userEmail)
          .eq('is_active', true)
          .single()

        if (childMatch) {
          console.log('[Auth Callback] Child login detected:', childMatch.name)
          // This is a child login - check/create their profile
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (!existingProfile) {
            // Create profile for child
            await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                family_id: childMatch.family_id,
                role: 'child',
                full_name: childMatch.name,
                email: userEmail,
              })

            // Link child record to profile
            await supabase
              .from('children')
              .update({ linked_profile_id: data.user.id })
              .eq('id', childMatch.id)
          }

          // Redirect child to dashboard
          return NextResponse.redirect(`${base}/`)
        }
      }

      // Not a child - check if user has a profile (parent flow)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, family_id')
        .eq('id', data.user.id)
        .single()

      console.log('[Auth Callback] Profile check:', profile ? 'exists' : 'not found', 'family_id:', profile?.family_id)

      if (!profile || !profile.family_id) {
        // New parent user - redirect to setup page
        return NextResponse.redirect(`${base}/auth/setup`)
      }

      // Existing user with family
      return NextResponse.redirect(`${base}${next}`)
    }
  }

  // No code - this might be implicit flow with hash fragment
  // Client side will handle this
  console.log('[Auth Callback] No code, redirecting to login')
  return NextResponse.redirect(`${base}/auth/login?error=callback_failed`)
}
