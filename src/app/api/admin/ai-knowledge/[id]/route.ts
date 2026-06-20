// src/app/api/admin/ai-knowledge/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
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
    await requireRole('admin')
    const { id } = await params
    const patch = patchSchema.parse(await req.json())
    const supabase = await createClient()
    const { data, error } = await supabase.from('ai_knowledge_entries').update(patch).eq('id', id).select().single()
    if (error) throw error
    return successResponse(data)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin')
    const { id } = await params
    const supabase = await createClient()
    const { error } = await supabase.from('ai_knowledge_entries').delete().eq('id', id)
    if (error) throw error
    return successResponse({ deleted: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}

/** POST /api/admin/ai-knowledge/[id]/embed — trigger embedding pipeline for one entry */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin')
    const { id } = await params
    await embedKnowledgeEntry(id)
    return successResponse({ embedded: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Embedding failed', 500)
  }
}
