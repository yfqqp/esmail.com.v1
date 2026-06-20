// src/app/api/admin/achievements/route.ts
import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminUpsertAchievement } from '@/services'
import { achievementSchema } from '@/lib/validation/sections'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    await requireRole('editor')
    const supabase = await createClient()
    const kind = req.nextUrl.searchParams.get('kind')
    let query = supabase.from('achievements').select('*').order('sort_order')
    if (kind) query = query.eq('kind', kind as any)
    const { data, error } = await query
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
    const body = achievementSchema.parse(await req.json())
    const achievement = await adminUpsertAchievement({ ...body, created_by: user.id } as any)
    return successResponse(achievement, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
