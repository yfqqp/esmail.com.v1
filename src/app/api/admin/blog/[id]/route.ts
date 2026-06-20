// src/app/api/admin/blog/[id]/route.ts
import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminUpsertBlogPost } from '@/services'
import { blogPostSchema } from '@/lib/validation/sections'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('editor')
    const { id } = await params
    const body = blogPostSchema.partial().parse(await req.json())

    const patch: Record<string, unknown> = { id, ...body }
    if (body.content_status === 'published') {
      const supabase = await createClient()
      const { data: existing } = await supabase.from('blog_posts').select('published_at').eq('id', id).single()
      if (!existing?.published_at) patch.published_at = new Date().toISOString()
    }

    const updated = await adminUpsertBlogPost(patch as any)
    return successResponse(updated)
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
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) throw error
    return successResponse({ deleted: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
