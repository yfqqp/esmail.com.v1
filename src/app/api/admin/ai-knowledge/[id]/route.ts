// src/app/api/admin/ai-knowledge/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminUpdateAIEntry, adminDeleteAIEntry } from '@/services'
import { embedKnowledgeEntry } from '@/lib/ai/chat'

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  raw_content: z.string().max(500000).optional(),
  tags: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const patch = patchSchema.parse(await req.json())
    const updated = await adminUpdateAIEntry(id, patch)
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
    await adminDeleteAIEntry(id)
    return successResponse({ deleted: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}

/** POST /api/admin/ai-knowledge/[id]/embed — trigger embedding pipeline for one entry */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    await embedKnowledgeEntry(id)
    return successResponse({ embedded: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Embedding failed', 500)
  }
}
