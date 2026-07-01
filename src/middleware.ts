// src/middleware.ts
// Runs on every request (Edge runtime). Responsibilities:
//   1. Guard /admin routes — verify the session cookie's JWT signature and
//      expiry (Edge-safe, no DB call) and redirect to /login if invalid.
//   2. Handle locale detection and routing via next-intl.
//
// Public routes (/ and /login, per the spec) are never gated. Every other
// path under /admin and every /api/admin/* route is protected.

import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { verifySessionEdge, SESSION_COOKIE_NAME } from '@/lib/auth/session-edge'

const LOCALES = ['en', 'ar', 'ru'] as const
const DEFAULT_LOCALE = 'en'

const intlMiddleware = createIntlMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // 'always': every route, including the default locale, carries an
  // explicit /en|/ar|/ru prefix. Required because admin routes below
  // intentionally skip intlMiddleware's rewrite step for their own
  // auth-redirect logic — with 'as-needed' that would leave bare "/admin"
  // unprefixed and unresolved by the [locale] dynamic segment the entire
  // app tree is built on, producing a 404.
  localePrefix: 'always',
})

const ADMIN_PATH_PATTERN = /^\/(?:en\/|ar\/|ru\/)?admin(?:\/|$)/
const ADMIN_API_PATH_PATTERN = /^\/api\/admin(?:\/|$)/

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminPage = ADMIN_PATH_PATTERN.test(pathname)
  const isAdminApi = ADMIN_API_PATH_PATTERN.test(pathname)
  const isApiRoute = pathname.startsWith('/api/')

  // ── Admin route protection (pages) ──────────────────────────────────────
  if (isAdminPage) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const authed = await verifySessionEdge(token)

    if (!authed) {
      const localeMatch = pathname.match(/^\/(en|ar|ru)\//)
      const locale = localeMatch?.[1] ?? DEFAULT_LOCALE
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  // ── Admin API protection ────────────────────────────────────────────────
  // Defense-in-depth: every /api/admin/* Route Handler also independently
  // calls requireAuth() (which does the full DB-backed revocation check on
  // the Node runtime). This Edge-level check blocks obviously-unauthenticated
  // requests earlier, before they reach the handler at all.
  if (isAdminApi) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const authed = await verifySessionEdge(token)
    if (!authed) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // ── Public routes: intl routing only, no auth gate ──────────────────────
  if (!isApiRoute) {
    return intlMiddleware(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
