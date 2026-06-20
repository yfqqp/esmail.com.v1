// src/app/api/admin/ai-knowledge/route.ts
import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetAIEntries, adminCreateAIEntry } from '@/services'
import { aiKnowledgeEntrySchema } from '@/lib/validation/sections'

export async function GET() {
  try {
    await requireRole('admin')
    const entries = await adminGetAIEntries()
    return successResponse(entries)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('admin')
    const body = aiKnowledgeEntrySchema.parse(await req.json())
    const entry = await adminCreateAIEntry({ ...body, created_by: user.id, embedding_model: null, token_count: null, source_url: body.source_url ?? null, raw_content: body.raw_content ?? null, file_media_id: null, notes: body.notes ?? null } as any)
    return successResponse(entry, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
