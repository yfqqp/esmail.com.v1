// src/app/api/admin/blog/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetAllBlogPosts, adminUpsertBlogPost } from '@/services'
import { blogPostSchema } from '@/lib/validation/sections'

export async function GET() {
  try {
    await requireAuth()
    const posts = await adminGetAllBlogPosts()
    return successResponse(posts)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = blogPostSchema.parse(await req.json())
    const post = await adminUpsertBlogPost(body as any)
    return successResponse(post, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
