// src/app/api/admin/sections/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminUpdateSection } from '@/services'
import { validateSectionContent } from '@/lib/validation/sections'
import { createClient } from '@/lib/supabase/server'
import type { SectionType } from '@/types'

const patchSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  is_visible: z.boolean().optional(),
  content: z.unknown().optional(),
  translations: z.unknown().optional(),
  layout_config: z.unknown().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('editor')
    const { id } = await params
    const patch = patchSchema.parse(await req.json())

    // If content is being updated, validate it against the section's type schema
    if (patch.content !== undefined) {
      const supabase = await createClient()
      const { data: existing } = await supabase.from('sections').select('section_type').eq('id', id).single()
      if (!existing) return errorResponse('Section not found', 404)

      const result = validateSectionContent(existing.section_type as SectionType, patch.content)
      if (!result.success) {
        return errorResponse(`Invalid content: ${result.error.issues.map(i => i.message).join(', ')}`, 422)
      }
      patch.content = result.data
    }

    const updated = await adminUpdateSection(id, patch as any)
    return successResponse(updated)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin')
    const { id } = await params
    const supabase = await createClient()
    const { error } = await supabase.from('sections').delete().eq('id', id)
    if (error) throw error
    return successResponse({ deleted: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
