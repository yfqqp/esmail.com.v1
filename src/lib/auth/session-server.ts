// src/lib/auth/session-server.ts
// NODE-RUNTIME ONLY. Never import this file from src/middleware.ts or any
// other Edge-runtime context — it imports @/lib/db/pool (the `pg` package,
// which opens raw TCP sockets and is incompatible with the Edge runtime)
// and Node's built-in `crypto` module. Safe to import from: Route Handlers
// under src/app/api/**, and Server Components (both execute on the Node
// runtime by default unless explicitly configured otherwise).
//
// This file owns full session lifecycle: issuing a new session (on OTP
// verification success), the complete validation check including the
// database-backed revocation list, and destroying a session (sign-out).
// The Edge-safe signature-only check used by middleware lives separately
// in session-edge.ts and intentionally does not import anything from here.

import { jwtVerify, SignJWT } from 'jose'
import { createHash, randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { query } from '@/lib/db/pool'
import { SESSION_COOKIE_NAME } from './session-edge'

const SESSION_DURATION_DAYS = 7

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters long.')
  }
  return new TextEncoder().encode(secret)
}

interface SessionPayload {
  sub: 'owner'
  sid: string
}

/** Issues a new signed session JWT, records its hash in auth_sessions, and sets the HttpOnly cookie. */
export async function createSession(meta: { userAgent?: string; ipAddress?: string }): Promise<void> {
  const sessionToken = randomUUID()
  const sessionHash = createHash('sha256').update(sessionToken).digest('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)

  await query(
    `insert into public.auth_sessions (session_hash, expires_at, user_agent, ip_address)
     values ($1, $2, $3, $4)`,
    [sessionHash, expiresAt, meta.userAgent ?? null, meta.ipAddress ?? null]
  )

  const jwt = await new SignJWT({ sub: 'owner', sid: sessionToken } satisfies SessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(getSecretKey())

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  })
}

/** Full verification (signature + expiry + not-revoked). Node runtime only — queries auth_sessions. */
export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false

  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    if (payload.sub !== 'owner' || typeof payload.sid !== 'string') return false

    const sessionHash = createHash('sha256').update(payload.sid).digest('hex')
    const rows = await query<{ revoked_at: string | null }>(
      `select revoked_at from public.auth_sessions where session_hash = $1 and expires_at > now()`,
      [sessionHash]
    )
    if (rows.length === 0) return false
    if (rows[0].revoked_at) return false

    return true
  } catch {
    return false
  }
}

/** Reads and validates the session cookie from the current request (Server Components / Route Handlers). */
export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  return verifySession(token)
}

/** Clears the session cookie and revokes it server-side. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey())
      if (typeof payload.sid === 'string') {
        const sessionHash = createHash('sha256').update(payload.sid).digest('hex')
        await query(`update public.auth_sessions set revoked_at = now() where session_hash = $1`, [sessionHash])
      }
    } catch {
      // token already invalid/expired — nothing to revoke
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}

export { SESSION_COOKIE_NAME }
