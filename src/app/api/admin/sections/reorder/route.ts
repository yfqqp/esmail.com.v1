// src/app/api/admin/sections/reorder/route.ts
import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminReorderSections } from '@/services'
import { z } from 'zod'

const bodySchema = z.object({ sectionIds: z.array(z.string().uuid()).min(1) })

export async function POST(req: NextRequest) {
  try {
    await requireRole('editor')
    const body = bodySchema.parse(await req.json())
    await adminReorderSections(body.sectionIds)
    return successResponse({ reordered: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
