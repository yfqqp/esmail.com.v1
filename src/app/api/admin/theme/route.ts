// src/app/api/admin/theme/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { getActiveTheme, adminUpdateTheme } from '@/services'

const themeSchema = z.object({
  colors: z.record(z.string(), z.string()).optional(),
  typography: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  spacing: z.record(z.string(), z.string()).optional(),
})

export async function GET() {
  try {
    await requireAuth()
    const theme = await getActiveTheme()
    if (!theme) return errorResponse('No active theme found', 404)
    return successResponse(theme)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth()
    const patch = themeSchema.parse(await req.json())
    const updated = await adminUpdateTheme(patch as any)
    return successResponse(updated)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
