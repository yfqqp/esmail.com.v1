// src/app/api/admin/upload/route.ts
// Handles file uploads from the admin Media Library. Accepts multipart
// form-data, uploads the buffer to Cloudinary, then indexes the result
// in media_items. Size-limited to 25MB at the application layer
// (Cloudinary's own limits are higher but we cap here for cost control).

import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { saveMediaItem } from '@/services'

const MAX_BYTES = 25 * 1024 * 1024 // 25MB
const KIND_BY_MIME: Record<string, 'image' | 'video' | 'document' | 'audio'> = {
  image: 'image', video: 'video', audio: 'audio', application: 'document', text: 'document',
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('editor')

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) ?? 'general'
    const altText = (formData.get('altText') as string) ?? ''
    const tags = ((formData.get('tags') as string) ?? '').split(',').map(t => t.trim()).filter(Boolean)

    if (!file) return errorResponse('No file provided', 400)
    if (file.size > MAX_BYTES) return errorResponse('File exceeds 25MB limit', 413)

    const buffer = Buffer.from(await file.arrayBuffer())
    const mimePrefix = file.type.split('/')[0]
    const kind = KIND_BY_MIME[mimePrefix] ?? 'other'

    const uploadResult = await uploadToCloudinary(buffer, {
      folder,
      resourceType: kind === 'image' ? 'image' : kind === 'video' ? 'video' : 'raw',
      tags,
    })

    const mediaItem = await saveMediaItem({
      kind,
      title: file.name.replace(/\.[^/.]+$/, ''),
      alt_text: altText || null,
      description: null,
      cloudinary_public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width || null,
      height: uploadResult.height || null,
      duration_seconds: uploadResult.duration ?? null,
      tags,
      folder,
      uploaded_by: user.id,
    })

    return successResponse(mediaItem, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Upload failed', 500)
  }
}

export const config = {
  api: { bodyParser: false },
}
