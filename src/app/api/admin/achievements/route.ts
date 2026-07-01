// src/app/api/admin/achievements/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetAllAchievements, adminUpsertAchievement, getPublishedAchievements } from '@/services'
import { achievementSchema } from '@/lib/validation/sections'

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const kind = req.nextUrl.searchParams.get('kind')
    const data = kind ? await getPublishedAchievements(kind) : await adminGetAllAchievements()
    return successResponse(data)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = achievementSchema.parse(await req.json())
    const achievement = await adminUpsertAchievement(body as any)
    return successResponse(achievement, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
