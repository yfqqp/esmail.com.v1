// src/app/api/auth/callback/route.ts
// Handles Supabase Auth email-link callbacks (magic link, password reset
// confirmation, email verification). Exchanges the code for a session and
// redirects into the admin dashboard.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect_to') ?? '/en/admin'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${redirectTo}`)
}
