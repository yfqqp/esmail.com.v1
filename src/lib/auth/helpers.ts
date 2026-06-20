// src/lib/auth/helpers.ts
// Server-side auth utilities. Used in middleware + Route Handlers.

import { createClient } from '@/lib/supabase/server'
import type { Profile, AppRole, AuthUser } from '@/types'

/** Get the current session user with their profile. Returns null if unauthenticated. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  return { id: user.id, email: user.email!, profile: profile ?? null }
}

/** Require authentication. Throws if not authenticated. */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) throw new AuthError('UNAUTHENTICATED', 'Authentication required', 401)
  return user
}

/** Require a minimum role. Throws if not authorized. */
export async function requireRole(minRole: AppRole): Promise<AuthUser> {
  const user = await requireAuth()
  const roleOrder: AppRole[] = ['viewer', 'editor', 'admin', 'owner']
  const userLevel = roleOrder.indexOf(user.profile?.role ?? 'viewer')
  const requiredLevel = roleOrder.indexOf(minRole)

  if (userLevel < requiredLevel) {
    throw new AuthError('FORBIDDEN', `Requires ${minRole} role or above`, 403)
  }
  return user
}

/** Helper to check admin status without throwing */
export async function isAdminUser(): Promise<boolean> {
  try {
    await requireRole('admin')
    return true
  } catch {
    return false
  }
}

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

/** Standard unauthorized JSON response factory */
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
