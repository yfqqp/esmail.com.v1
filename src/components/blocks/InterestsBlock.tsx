// src/components/blocks/InterestsBlock.tsx
import type { Section, InterestsContent } from '@/types'
import { SectionWrap, SectionEyebrow, Heading, FadeUp } from './shared'

export function InterestsBlock({ section }: { section: Section }) {
  const content = section.content as unknown as InterestsContent
  return (
    <SectionWrap id={section.slug}>
      <FadeUp><SectionEyebrow text={section.label} /></FadeUp>
      <FadeUp delay={0.1}><Heading>What I&apos;m <span className="text-accent">drawn to</span></Heading></FadeUp>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {content.items.map((item, i) => (
          <FadeUp key={i} delay={i * 0.07}>
            <div className="bg-card border border-border rounded-2xl p-7 transition-all hover:border-border-bright hover:-translate-y-1">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-display text-base font-bold text-[var(--color-text)] mb-2.5">{item.name}</h3>
              <p className="text-muted text-[13px] leading-relaxed m-0">{item.desc}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </SectionWrap>
  )
}
