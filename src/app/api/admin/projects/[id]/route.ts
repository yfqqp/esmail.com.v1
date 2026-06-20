// src/app/api/admin/projects/[id]/route.ts
import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminUpsertProject, adminDeleteProject } from '@/services'
import { projectSchema } from '@/lib/validation/sections'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('editor')
    const { id } = await params
    const body = projectSchema.partial().parse(await req.json())
    const project = await adminUpsertProject({ id, ...body } as any)
    return successResponse(project)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin')
    const { id } = await params
    await adminDeleteProject(id)
    return successResponse({ deleted: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
