// src/app/api/admin/navigation/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetAllNavItems, adminCreateNavItem } from '@/services'

const navSchema = z.object({
  label: z.string().min(1).max(100),
  item_type: z.enum(['section_anchor', 'internal_page', 'external_url']),
  target: z.string().min(1).max(300),
  is_visible: z.boolean().default(true),
  open_new_tab: z.boolean().default(false),
})

export async function GET() {
  try {
    await requireAuth()
    const items = await adminGetAllNavItems()
    return successResponse(items)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = navSchema.parse(await req.json())
    const item = await adminCreateNavItem(body)
    return successResponse(item, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
