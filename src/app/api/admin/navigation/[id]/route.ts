// src/app/api/admin/navigation/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'

const patchSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  target: z.string().min(1).max(300).optional(),
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  open_new_tab: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('editor')
    const { id } = await params
    const patch = patchSchema.parse(await req.json())
    const supabase = await createClient()
    const { data, error } = await supabase.from('navigation_items').update(patch).eq('id', id).select().single()
    if (error) throw error
    return successResponse(data)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('editor')
    const { id } = await params
    const supabase = await createClient()
    const { error } = await supabase.from('navigation_items').delete().eq('id', id)
    if (error) throw error
    return successResponse({ deleted: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
