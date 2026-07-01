// src/app/api/admin/seo/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetAllSEOSettings, adminUpdateSEOSettings } from '@/services'

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
    await requireAuth()
    const data = await adminGetAllSEOSettings()
    return successResponse(data)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth()
    const body = patchSchema.parse(await req.json())
    const { page_key, ...patch } = body
    const updated = await adminUpdateSEOSettings(page_key, patch)
    return successResponse(updated)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
