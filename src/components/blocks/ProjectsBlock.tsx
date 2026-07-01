// src/components/blocks/ProjectsBlock.tsx
import Link from 'next/link'
import type { Section, ProjectsSectionContent, Project } from '@/types'
import { SectionWrap, SectionEyebrow, Heading, FadeUp, Tag } from './shared'

const STATUS_COLOR: Record<string, string> = {
  active: '#22C55E', completed: '#4F6EF7', planned: '#7A869A', on_hold: '#F59E0B', archived: '#3D4F6B',
}

export function ProjectsBlock({ section, projects, locale }: { section: Section; projects: Project[]; locale: string }) {
  const content = section.content as unknown as ProjectsSectionContent

  return (
    <SectionWrap id={section.slug}>
      <FadeUp><SectionEyebrow text={section.label} /></FadeUp>
      <FadeUp delay={0.1}>
        <Heading>Things I&apos;m <span className="text-accent">building</span></Heading>
      </FadeUp>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {projects.slice(0, content.itemsPerPage).map((p, i) => (
          <FadeUp key={p.id} delay={i * 0.09}>
            <Link
              href={`/${locale}/projects/${p.slug}`}
              className="block bg-card border border-border rounded-2xl p-7 h-full transition-all hover:border-accent hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(79,110,247,0.1)]"
            >
              <div className="flex justify-between items-start mb-4">
                <Tag>{p.category}</Tag>
                <span className="flex items-center gap-1.5 text-[11px]" style={{ color: STATUS_COLOR[p.status] }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: STATUS_COLOR[p.status] }} />
                  {p.status}
                </span>
              </div>
              <h3 className="font-display text-[1.15rem] font-bold text-[var(--color-text)] mb-3">{p.title}</h3>
              <p className="text-muted text-[13px] leading-relaxed mb-5 line-clamp-3">{p.summary}</p>
              <div className="flex flex-wrap gap-1.5">
                {p.tech_stack.slice(0, 4).map(t => <Tag key={t} color="gray">{t}</Tag>)}
              </div>
            </Link>
          </FadeUp>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-muted text-sm mt-8">No published projects yet. Add some from the admin dashboard.</p>
      )}
    </SectionWrap>
  )
}
