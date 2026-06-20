// src/app/api/admin/users/[id]/route.ts
// Role changes are owner-only by design: an admin must not be able to
// promote themselves or others to owner, and editors/viewers should never
// reach this route at all (requireRole('owner') blocks them before any
// row is touched). The RLS policy on profiles provides defense-in-depth
// in case this check is ever bypassed at the application layer.

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'

const patchSchema = z.object({
  role: z.enum(['owner', 'admin', 'editor', 'viewer']).optional(),
  is_active: z.boolean().optional(),
  display_name: z.string().max(100).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requester = await requireRole('owner')
    const { id } = await params
    const patch = patchSchema.parse(await req.json())

    if (id === requester.id && patch.role && patch.role !== 'owner') {
      return errorResponse('You cannot demote your own owner account.', 400)
    }

    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select().single()
    if (error) throw error
    return successResponse(data)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
