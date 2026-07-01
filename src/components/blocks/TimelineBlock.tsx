// src/components/blocks/TimelineBlock.tsx
'use client'

import { useState } from 'react'
import type { Section, TimelineContent, TimelineEvent } from '@/types'
import { SectionWrap, SectionEyebrow, Heading, FadeUp } from './shared'

export function TimelineBlock({ section, events }: { section: Section; events: TimelineEvent[] }) {
  const content = section.content as unknown as TimelineContent
  const [active, setActive] = useState(0)
  const headingParts = content.heading.split(' ')

  if (!events.length) return null
  const current = events[active]

  return (
    <SectionWrap id={section.slug}>
      <FadeUp><SectionEyebrow text={section.label} /></FadeUp>
      <FadeUp delay={0.1}>
        <Heading>
          {headingParts[0]}<br />
          <span className="text-accent">{headingParts.slice(1).join(' ')}</span>
        </Heading>
      </FadeUp>
      <FadeUp delay={0.15}>
        <p className="text-muted text-base leading-relaxed max-w-[540px] mb-14">{content.subheading}</p>
      </FadeUp>

      <div className="grid grid-cols-1 md:grid-cols-[clamp(180px,22vw,260px)_1fr] gap-12">
        <div className="md:sticky md:top-[100px] self-start">
          {events.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActive(i)}
              className="flex items-start w-full bg-transparent border-0 py-3.5 pl-5 text-left cursor-pointer transition-all"
              style={{ borderLeft: `2px solid ${active === i ? '#4F6EF7' : '#1A2540'}` }}
            >
              <div>
                <div
                  className="font-display text-[11px] font-bold tracking-[0.1em] mb-0.5"
                  style={{ color: active === i ? '#4F6EF7' : '#3D4F6B' }}
                >
                  {item.year}
                </div>
                <div className={`text-[13px] ${active === i ? 'text-[var(--color-text)] font-semibold' : 'text-muted font-normal'}`}>
                  {item.title}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div
          className="rounded-[20px] border border-border"
          style={{ background: '#111827', padding: 'clamp(1.5rem, 4vw, 3rem)', minHeight: '280px' }}
        >
          <div className="font-display text-[clamp(2rem,5vw,3rem)] font-extrabold text-accent mb-1">{current.year}</div>
          <div className="font-display text-[1.4rem] font-bold text-[var(--color-text)] mb-5">{current.title}</div>
          <p className="text-muted text-[1.05rem] leading-relaxed">{current.body}</p>
        </div>
      </div>
    </SectionWrap>
  )
}
