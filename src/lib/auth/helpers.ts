// src/lib/auth/helpers.ts
// Single-owner auth helpers. There is no role hierarchy anymore — a request
// is either authenticated as the owner, or it isn't. Every admin API route
// calls requireAuth() before touching the database.

import { getSession } from './session-server'

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/** Throws AuthError(401) if the request's session cookie is missing/invalid/expired/revoked. */
export async function requireAuth(): Promise<void> {
  const authenticated = await getSession()
  if (!authenticated) {
    throw new AuthError('UNAUTHENTICATED', 'Authentication required', 401)
  }
}

/** Non-throwing check, for conditional UI/redirect logic. */
export async function isAuthenticated(): Promise<boolean> {
  return getSession()
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return Response.json({ success: false, error: message }, { status: 401 })
}

export function forbiddenResponse(message = 'Forbidden') {
  return Response.json({ success: false, error: message }, { status: 403 })
}

export function errorResponse(message: string, status = 500) {
  return Response.json({ success: false, error: message }, { status })
}

export function successResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}
