// src/app/api/admin/navigation/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminUpdateNavItem, adminDeleteNavItem } from '@/services'

const patchSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  target: z.string().min(1).max(300).optional(),
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  open_new_tab: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const patch = patchSchema.parse(await req.json())
    const updated = await adminUpdateNavItem(id, patch)
    return successResponse(updated)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    await adminDeleteNavItem(id)
    return successResponse({ deleted: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
