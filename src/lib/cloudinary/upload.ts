// src/lib/cloudinary/upload.ts
// Server-side Cloudinary operations. Never called from the browser directly.
// The /api/admin/upload route handler calls these after auth + size checks.

import { v2 as cloudinary } from 'cloudinary'
import type { CloudinaryUploadResult } from '@/types'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
})

export interface UploadOptions {
  folder?: string
  publicId?: string
  transformation?: object
  resourceType?: 'image' | 'video' | 'raw' | 'auto'
  tags?: string[]
}

/** Upload a file buffer or base64 string to Cloudinary */
export async function uploadToCloudinary(
  source: string | Buffer,      // base64 data URI or file path
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const input = Buffer.isBuffer(source) ? `data:application/octet-stream;base64,${source.toString('base64')}` : source

  const result = await cloudinary.uploader.upload(input, {
    folder: `ismail-platform/${options.folder ?? 'general'}`,
    public_id: options.publicId,
    resource_type: options.resourceType ?? 'auto',
    tags: options.tags,
    transformation: options.transformation,
    // Automatic quality and format optimization
    quality: 'auto',
    fetch_format: 'auto',
  })

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    format: result.format,
    width: result.width ?? 0,
    height: result.height ?? 0,
    bytes: result.bytes,
    resource_type: result.resource_type,
    duration: result.duration,
  }
}

/** Delete an asset from Cloudinary by public_id */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

/** Generate a signed upload URL for direct browser → Cloudinary uploads (optional pattern) */
export function generateSignedUploadParams(folder: string): {
  signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string
} {
  const timestamp = Math.round(Date.now() / 1000)
  const folderPath = `ismail-platform/${folder}`
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: folderPath },
    process.env.CLOUDINARY_API_SECRET!
  )
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder: folderPath,
  }
}

/** Build a Cloudinary transformation URL */
export function buildImageUrl(publicId: string, opts: {
  width?: number; height?: number; crop?: string; quality?: string | number; format?: string
} = {}): string {
  return cloudinary.url(publicId, {
    width: opts.width,
    height: opts.height,
    crop: opts.crop ?? 'fill',
    quality: opts.quality ?? 'auto',
    fetch_format: opts.format ?? 'auto',
    secure: true,
  })
}
