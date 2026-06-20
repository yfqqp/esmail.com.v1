// src/components/blocks/AcademicBlock.tsx
import type { Section, AcademicContent, Achievement } from '@/types'
import { SectionWrap, SectionEyebrow, Heading, FadeUp, Tag } from './shared'

export function AcademicBlock({ section, achievements }: { section: Section; achievements: Achievement[] }) {
  const content = section.content as unknown as AcademicContent

  return (
    <SectionWrap id={section.slug}>
      <FadeUp><SectionEyebrow text={section.label} /></FadeUp>
      <FadeUp delay={0.1}>
        <Heading>Built on <span className="text-accent">rigor & vision</span></Heading>
      </FadeUp>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
        {content.stats.map((s, i) => (
          <FadeUp key={i} delay={i * 0.08}>
            <div className="bg-card border border-border rounded-2xl p-7 transition-all hover:border-accent hover:-translate-y-1">
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="font-display text-[2rem] font-extrabold text-[var(--color-text)]">{s.value}</div>
              <div className="text-muted text-xs mt-1">{s.label}</div>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp delay={0.35}>
        <div className="bg-card border border-border rounded-2xl p-8 mb-6">
          <div className="font-display text-base font-bold text-[var(--color-text)] mb-4">Research Interests</div>
          <div className="flex flex-wrap gap-2">
            {content.researchTags.map(tag => <Tag key={tag}>{tag}</Tag>)}
          </div>
        </div>
      </FadeUp>

      {achievements.length > 0 && (
        <FadeUp delay={0.45}>
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="font-display text-base font-bold text-[var(--color-text)] mb-4">🏅 Certificates & Achievements</div>
            {achievements.map((a, i) => (
              <div
                key={a.id}
                className="flex justify-between items-center py-2.5"
                style={{ borderBottom: i < achievements.length - 1 ? '1px solid #1A2540' : 'none' }}
              >
                <div>
                  <div className="text-[var(--color-text)] text-sm font-medium">{a.title}</div>
                  <div className="text-muted text-xs mt-0.5">{a.issuer}</div>
                </div>
                <Tag color="amber">{a.rank_or_result ?? a.kind}</Tag>
              </div>
            ))}
          </div>
        </FadeUp>
      )}
    </SectionWrap>
  )
}
