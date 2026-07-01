// src/app/api/auth/logout/route.ts
// Sign-out must happen server-side: the session cookie is HttpOnly by
// design (see lib/auth/session.ts), meaning client-side JavaScript cannot
// read or clear it directly — that's the entire point of HttpOnly as a
// defense against XSS-based session theft. This route revokes the session
// in auth_sessions and clears the cookie via the Set-Cookie response header.

import { destroySession } from '@/lib/auth/session-server'
import { successResponse } from '@/lib/auth/helpers'

export async function POST() {
  await destroySession()
  return successResponse({ signedOut: true })
}
