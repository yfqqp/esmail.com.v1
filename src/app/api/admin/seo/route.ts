// src/app/api/admin/seo/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'

const patchSchema = z.object({
  page_key: z.string().min(1),
  title: z.string().max(70).optional(),
  description: z.string().max(160).optional(),
  og_title: z.string().max(70).optional(),
  og_description: z.string().max(160).optional(),
  og_image_url: z.string().url().optional().or(z.literal('')),
  no_index: z.boolean().optional(),
})

export async function GET() {
  try {
    await requireRole('editor')
    const supabase = await createClient()
    const { data, error } = await supabase.from('seo_settings').select('*').order('page_key')
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
    const body = patchSchema.parse(await req.json())
    const supabase = await createClient()
    const { page_key, ...patch } = body
    const { data, error } = await supabase.from('seo_settings').update(patch).eq('page_key', page_key).select().single()
    if (error) throw error
    return successResponse(data)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
