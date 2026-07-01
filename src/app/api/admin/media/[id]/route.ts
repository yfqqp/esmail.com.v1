// src/app/api/admin/media/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { deleteMediaItem, getMediaItemById, updateMediaItem } from '@/services'
import { deleteFromCloudinary } from '@/lib/cloudinary/upload'

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  alt_text: z.string().max(300).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().max(100).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const patch = patchSchema.parse(await req.json())
    const updated = await updateMediaItem(id, patch)
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

    const item = await getMediaItemById(id)
    if (item) {
      const resourceType = item.kind === 'image' ? 'image' : item.kind === 'video' ? 'video' : 'raw'
      await deleteFromCloudinary(item.cloudinary_public_id, resourceType).catch(() => {
        console.error(`Failed to delete Cloudinary asset ${item.cloudinary_public_id}`)
      })
    }

    await deleteMediaItem(id)
    return successResponse({ deleted: true })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
