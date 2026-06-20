// src/app/api/admin/settings/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { getSiteSettings, adminUpdateSiteSetting } from '@/services'

const patchSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
})

export async function GET() {
  try {
    await requireRole('editor')
    const settings = await getSiteSettings()
    return successResponse(settings)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole('admin')
    const { key, value } = patchSchema.parse(await req.json())
    await adminUpdateSiteSetting(key, value)
    return successResponse({ key, value })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
