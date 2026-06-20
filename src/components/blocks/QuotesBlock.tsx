// src/components/blocks/QuotesBlock.tsx
import type { Section, QuotesSectionContent, Quote } from '@/types'
import { SectionWrap, SectionEyebrow, Heading, FadeUp } from './shared'

export function QuotesBlock({ section, quotes }: { section: Section; quotes: Quote[] }) {
  const content = section.content as unknown as QuotesSectionContent

  return (
    <SectionWrap id={section.slug}>
      <FadeUp><SectionEyebrow text={section.label} /></FadeUp>
      <FadeUp delay={0.1}><Heading>What I <span style={{ color: '#F0A500' }}>believe</span></Heading></FadeUp>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {quotes.map((q, i) => (
          <FadeUp key={q.id} delay={i * 0.1}>
            <div
              className="bg-card border border-border rounded-2xl p-8 transition-all"
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#F0A500')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1A2540')}
            >
              <div className="font-display text-5xl leading-none mb-3" style={{ color: '#F0A500', opacity: 0.2 }}>&ldquo;</div>
              <p className="text-[var(--color-text)] text-[15px] leading-relaxed italic mb-4">{q.text}</p>
              <div className="text-accent text-xs font-semibold">— {q.author}</div>
            </div>
          </FadeUp>
        ))}
      </div>
    </SectionWrap>
  )
}
