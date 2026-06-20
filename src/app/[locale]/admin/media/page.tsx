// src/app/[locale]/admin/media/page.tsx
import { getMediaItems } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { MediaLibraryClient } from '@/components/admin/media-library/MediaLibraryClient'

export default async function AdminMediaPage() {
  const { data } = await getMediaItems({ limit: 200 })
  return (
    <div>
      <PageHeader title="Media Library" description="Images, videos, and documents — backed by Cloudinary" />
      <MediaLibraryClient initial={data} />
    </div>
  )
}
