// src/app/api/admin/achievements/[id]/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminUpsertAchievement, adminDeleteAchievement } from '@/services'
import { achievementSchema } from '@/lib/validation/sections'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const body = achievementSchema.partial().parse(await req.json())
    const updated = await adminUpsertAchievement({ id, ...body } as any)
    return successResponse(updated)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    await adminDeleteAchievement(id)
    return successResponse({ deleted: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
