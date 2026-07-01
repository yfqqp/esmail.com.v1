// src/app/api/admin/timeline/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetAllTimelineEvents, adminUpsertTimelineEvent } from '@/services'
import { timelineEventSchema } from '@/lib/validation/sections'

export async function GET() {
  try {
    await requireAuth()
    const events = await adminGetAllTimelineEvents()
    return successResponse(events)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = timelineEventSchema.parse(await req.json())
    const event = await adminUpsertTimelineEvent(body as any)
    return successResponse(event, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
