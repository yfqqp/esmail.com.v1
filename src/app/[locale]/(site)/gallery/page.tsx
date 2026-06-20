// src/app/[locale]/(site)/gallery/page.tsx
import Image from 'next/image'
import { getMediaItems } from '@/services'

export const metadata = { title: 'Gallery' }

export default async function GalleryPage() {
  const { data: media } = await getMediaItems({ kind: 'image', limit: 100 })

  return (
    <div className="max-w-[1200px] mx-auto" style={{ padding: '160px clamp(1.5rem, 5vw, 3.5rem) 100px' }}>
      <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-extrabold text-[var(--color-text)] mb-10">
        Gallery
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map(item => (
          <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
            <Image
              src={item.secure_url}
              alt={item.alt_text ?? item.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        ))}
      </div>
      {media.length === 0 && <p className="text-muted">No images uploaded yet.</p>}
    </div>
  )
}
