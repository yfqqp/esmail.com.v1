// src/app/api/admin/blog/route.ts
import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminUpsertBlogPost } from '@/services'
import { blogPostSchema } from '@/lib/validation/sections'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    await requireRole('editor')
    const supabase = await createClient()
    const status = req.nextUrl.searchParams.get('status')
    let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    if (status) query = query.eq('content_status', status as any)
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
    const body = blogPostSchema.parse(await req.json())
    const post = await adminUpsertBlogPost({
      ...body,
      author_id: user.id,
      published_at: body.content_status === 'published' ? new Date().toISOString() : null,
    } as any)
    return successResponse(post, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
