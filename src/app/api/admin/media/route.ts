// src/app/api/admin/media/route.ts
import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { getMediaItems } from '@/services'

export async function GET(req: NextRequest) {
  try {
    await requireRole('editor')
    const sp = req.nextUrl.searchParams
    const result = await getMediaItems({
      kind: sp.get('kind') ?? undefined,
      folder: sp.get('folder') ?? undefined,
      search: sp.get('search') ?? undefined,
      limit: Number(sp.get('limit') ?? 60),
      offset: Number(sp.get('offset') ?? 0),
    })
    return successResponse(result)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}
