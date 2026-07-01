// src/app/api/admin/timeline/[id]/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminUpsertTimelineEvent, adminDeleteTimelineEvent } from '@/services'
import { timelineEventSchema } from '@/lib/validation/sections'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const body = timelineEventSchema.partial().parse(await req.json())
    const updated = await adminUpsertTimelineEvent({ id, ...body } as any)
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
    await adminDeleteTimelineEvent(id)
    return successResponse({ deleted: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
