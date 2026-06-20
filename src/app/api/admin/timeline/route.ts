// src/app/api/admin/timeline/route.ts
import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminUpsertTimelineEvent } from '@/services'
import { timelineEventSchema } from '@/lib/validation/sections'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireRole('editor')
    const supabase = await createClient()
    const { data, error } = await supabase.from('timeline_events').select('*').order('sort_order')
    if (error) throw error
    return successResponse(data)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('editor')
    const body = timelineEventSchema.parse(await req.json())
    const event = await adminUpsertTimelineEvent({ ...body, created_by: user.id } as any)
    return successResponse(event, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
