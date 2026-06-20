// src/app/api/admin/theme/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'

const themeSchema = z.object({
  colors: z.record(z.string(), z.string()).optional(),
  typography: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  spacing: z.record(z.string(), z.string()).optional(),
})

export async function GET() {
  try {
    await requireRole('editor')
    const supabase = await createClient()
    const { data, error } = await supabase.from('theme_settings').select('*').eq('is_active', true).single()
    if (error) throw error
    return successResponse(data)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole('admin')
    const patch = themeSchema.parse(await req.json())
    const supabase = await createClient()

    const { data: active } = await supabase.from('theme_settings').select('id, colors, typography, spacing').eq('is_active', true).single()
    if (!active) return errorResponse('No active theme found', 404)

    const { data, error } = await supabase.from('theme_settings').update({
      colors: { ...active.colors, ...(patch.colors ?? {}) },
      typography: { ...active.typography, ...(patch.typography ?? {}) },
      spacing: { ...active.spacing, ...(patch.spacing ?? {}) },
    }).eq('id', active.id).select().single()

    if (error) throw error
    return successResponse(data)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
