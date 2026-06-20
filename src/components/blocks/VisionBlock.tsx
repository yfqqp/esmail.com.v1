// src/components/blocks/VisionBlock.tsx
import type { Section, VisionContent } from '@/types'
import { SectionWrap, SectionEyebrow, Heading, FadeUp } from './shared'

export function VisionBlock({ section }: { section: Section }) {
  const content = section.content as unknown as VisionContent
  return (
    <SectionWrap id={section.slug}>
      <FadeUp><SectionEyebrow text={section.label} /></FadeUp>
      <FadeUp delay={0.1}><Heading>Where I&apos;m <span className="text-accent">going</span></Heading></FadeUp>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <FadeUp delay={0.2}>
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="font-display text-base font-bold text-[var(--color-text)] mb-5">🎓 Dream Universities</div>
            {content.universities.map((u, i) => (
              <div
                key={u}
                className="flex items-center gap-3 py-2"
                style={{ borderBottom: i < content.universities.length - 1 ? '1px solid #1A2540' : 'none' }}
              >
                <span className="text-accent text-[11px] font-bold w-[18px] flex-shrink-0">0{i + 1}</span>
                <span className="text-muted text-[13.5px]">{u}</span>
              </div>
            ))}
          </div>
        </FadeUp>

        <div className="flex flex-col gap-5">
          <FadeUp delay={0.3}>
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="font-display text-base font-bold text-[var(--color-text)] mb-3">🚀 Career Path</div>
              <p className="text-muted text-[13.5px] leading-relaxed m-0">{content.career}</p>
            </div>
          </FadeUp>
          <FadeUp delay={0.4}>
            <div
              className="rounded-2xl p-8"
              style={{
                background: 'linear-gradient(135deg, rgba(79,110,247,0.12), rgba(240,165,0,0.10))',
                border: '1px solid rgba(79,110,247,0.18)',
              }}
            >
              <div className="font-display text-base font-bold text-[var(--color-text)] mb-3">🌍 Desired Impact</div>
              <p className="text-muted text-[13.5px] leading-relaxed m-0">{content.impact}</p>
            </div>
          </FadeUp>
        </div>
      </div>
    </SectionWrap>
  )
}
