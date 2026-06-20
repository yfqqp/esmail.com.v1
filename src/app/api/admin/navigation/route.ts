// src/app/api/admin/navigation/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetAllNavItems } from '@/services'
import { createClient } from '@/lib/supabase/server'

const navSchema = z.object({
  label: z.string().min(1).max(100),
  item_type: z.enum(['section_anchor', 'internal_page', 'external_url']),
  target: z.string().min(1).max(300),
  is_visible: z.boolean().default(true),
  open_new_tab: z.boolean().default(false),
})

export async function GET() {
  try {
    await requireRole('editor')
    const items = await adminGetAllNavItems()
    return successResponse(items)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole('editor')
    const body = navSchema.parse(await req.json())
    const supabase = await createClient()

    const { data: maxRow } = await supabase.from('navigation_items').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
    const nextOrder = (maxRow?.sort_order ?? -1) + 1

    const { data, error } = await supabase.from('navigation_items').insert({ ...body, sort_order: nextOrder, translations: {} } as any).select().single()
    if (error) throw error
    return successResponse(data, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
