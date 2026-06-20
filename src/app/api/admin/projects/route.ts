// src/app/api/admin/projects/route.ts
import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetProjects, adminUpsertProject } from '@/services'
import { projectSchema } from '@/lib/validation/sections'

export async function GET(req: NextRequest) {
  try {
    await requireRole('editor')
    const sp = req.nextUrl.searchParams
    const result = await adminGetProjects({
      page: Number(sp.get('page') ?? 1),
      pageSize: Number(sp.get('pageSize') ?? 20),
      search: sp.get('search') ?? undefined,
      status: sp.get('status') ?? undefined,
      category: sp.get('category') ?? undefined,
      sortBy: sp.get('sortBy') ?? undefined,
      sortDir: (sp.get('sortDir') as 'asc' | 'desc') ?? undefined,
    })
    return successResponse(result)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('editor')
    const body = projectSchema.parse(await req.json())
    const project = await adminUpsertProject({ ...body, created_by: user.id } as any)
    return successResponse(project, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
