// src/lib/auth/session-edge.ts
// EDGE-SAFE MODULE. This file is imported by src/middleware.ts, which runs
// on the Edge runtime by default. Edge has no access to Node's `crypto`
// module, TCP sockets, or any package that opens a raw socket connection
// (like `pg`) — importing one, even without calling it, breaks the Edge
// bundle, because webpack bundles at the file level: an import pulls in
// that module's entire top-level dependency graph regardless of which
// exports are actually used at runtime.
//
// HARD RULE FOR THIS FILE: it may import `jose` (Edge-compatible by design)
// and `next/server`/`next/headers`-style cookie reading primitives, and
// nothing else. No `@/lib/db/pool`, no `pg`, no Node's `crypto` module, no
// `resend`, no OTP storage, no database helpers of any kind — not even
// transitively. If you need to add a check that requires a database query,
// it does NOT belong in this file; put it in session-server.ts instead and
// call it only from Node-runtime Route Handlers / Server Components.
//
// This file's sole responsibility: given a raw cookie string, verify the
// JWT's signature and structure. It intentionally does NOT check the
// auth_sessions revocation table — that requires a database round-trip and
// is handled separately by verifySession() in session-server.ts, called
// only from Node-runtime code (API routes, Server Components), never from
// middleware.

import { jwtVerify } from 'jose'

export const SESSION_COOKIE_NAME = 'session'

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters long.')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Edge-safe verification: checks JWT signature, subject, and expiry only —
 * no database call, no Node-only APIs. This is sufficient to block obviously
 * unauthenticated requests at the edge. It does NOT check the revocation
 * list (auth_sessions.revoked_at) — "sign out everywhere" only takes full
 * effect once a request reaches a Node-runtime handler that calls the
 * complete verifySession() in session-server.ts. That's an intentional,
 * narrow trade-off: revocation has at most one request's worth of lag at
 * the edge layer, in exchange for middleware never touching a database
 * connection.
 */
export async function verifySessionEdge(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload.sub === 'owner' && typeof payload.sid === 'string'
  } catch {
    return false
  }
}
