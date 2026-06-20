// src/components/blocks/GalleryBlock.tsx
import Image from 'next/image'
import type { Section, GalleryContent, MediaItem } from '@/types'
import { SectionWrap, SectionEyebrow, Heading, FadeUp } from './shared'

export function GalleryBlock({ section, media }: { section: Section; media: MediaItem[] }) {
  const content = section.content as unknown as GalleryContent
  const cols = content.columns ?? 3

  return (
    <SectionWrap id={section.slug}>
      <FadeUp><SectionEyebrow text={section.label} /></FadeUp>
      <FadeUp delay={0.1}><Heading>{content.heading}</Heading></FadeUp>

      <div
        className="grid gap-4 mt-8"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {media.map((item, i) => (
          <FadeUp key={item.id} delay={i * 0.05}>
            <div className="relative aspect-square rounded-xl overflow-hidden border border-border group">
              <Image
                src={item.secure_url}
                alt={item.alt_text ?? item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          </FadeUp>
        ))}
      </div>

      {media.length === 0 && (
        <p className="text-muted text-sm mt-8">No media in this gallery yet.</p>
      )}
    </SectionWrap>
  )
}
