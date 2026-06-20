// src/middleware.ts
// Runs on every request. Responsibilities:
//   1. Refresh Supabase auth session cookie (required by @supabase/ssr)
//   2. Guard /[locale]/admin routes — redirect to login if not authenticated
//   3. Handle locale detection and routing via next-intl

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import type { Database } from '@/types/database'

// ── Supported locales ────────────────────────────────────────────────────────
const LOCALES = ['en', 'ar', 'ru'] as const
const DEFAULT_LOCALE = 'en'

// next-intl middleware handles locale prefix routing
const intlMiddleware = createIntlMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',   // /en → /, /ar → /ar/..., /ru → /ru/...
})

// ── Admin route pattern ──────────────────────────────────────────────────────
const ADMIN_PATH_PATTERN = /^\/(?:en\/|ar\/|ru\/)?admin(?:\/|$)/

export async function middleware(request: NextRequest) {
  // Pass non-admin, non-API routes straight through intl middleware
  const { pathname } = request.nextUrl
  const isAdminRoute = ADMIN_PATH_PATTERN.test(pathname)
  const isApiRoute = pathname.startsWith('/api/')

  // ── Session refresh (required on all routes for @supabase/ssr) ─────────────
  let response = isAdminRoute || isApiRoute
    ? NextResponse.next({ request })
    : intlMiddleware(request)

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — MUST be called before any auth checks
  const { data: { user } } = await supabase.auth.getUser()

  // ── Admin route protection ──────────────────────────────────────────────────
  if (isAdminRoute) {
    if (!user) {
      // Determine locale prefix from path for the redirect
      const localeMatch = pathname.match(/^\/(en|ar|ru)\//)
      const locale = localeMatch?.[1] ?? DEFAULT_LOCALE
      const loginUrl = new URL(`/${locale === DEFAULT_LOCALE ? '' : locale + '/'}login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // User is authenticated; role check happens inside each admin page/API handler
    // Middleware only confirms "is there a session" to avoid the profile DB hit on every request
  }

  // ── Apply intl routing for non-admin web routes ───────────────────────────
  if (!isAdminRoute && !isApiRoute) {
    return intlMiddleware(request)
  }

  return response
}

export const config = {
  matcher: [
    // All routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
