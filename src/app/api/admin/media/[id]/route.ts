// src/app/api/admin/media/[id]/route.ts
import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { deleteMediaItem } from '@/services'
import { deleteFromCloudinary } from '@/lib/cloudinary/upload'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  alt_text: z.string().max(300).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().max(100).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('editor')
    const { id } = await params
    const patch = patchSchema.parse(await req.json())
    const supabase = await createClient()
    const { data, error } = await supabase.from('media_items').update(patch).eq('id', id).select().single()
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

    const { data: item } = await supabase.from('media_items').select('cloudinary_public_id, kind').eq('id', id).single()
    if (item) {
      const resourceType = item.kind === 'image' ? 'image' : item.kind === 'video' ? 'video' : 'raw'
      await deleteFromCloudinary(item.cloudinary_public_id, resourceType).catch(() => {
        // Cloudinary deletion failure shouldn't block DB cleanup; log via console for ops visibility
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
