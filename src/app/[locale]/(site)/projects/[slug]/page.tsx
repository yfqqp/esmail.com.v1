// src/app/[locale]/(site)/projects/[slug]/page.tsx
// force-dynamic: same reasoning as blog/[slug]/page.tsx — project slugs are
// CMS-managed and not enumerable at build time without coupling the build
// to live DB state.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getProjectBySlug } from '@/services'
import { Tag } from '@/components/blocks/shared'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return {}
  return {
    title: project.seo_title ?? project.title,
    description: project.seo_description ?? project.summary ?? undefined,
  }
}

const STATUS_COLOR: Record<string, string> = {
  active: '#22C55E', completed: '#4F6EF7', planned: '#7A869A', on_hold: '#F59E0B', archived: '#3D4F6B',
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  setRequestLocale(locale)

  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  return (
    <article className="max-w-[800px] mx-auto" style={{ padding: '160px clamp(1.5rem, 5vw, 3.5rem) 100px' }}>
      <div className="flex items-center gap-3 mb-6">
        <Tag>{project.category}</Tag>
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: STATUS_COLOR[project.status] }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: STATUS_COLOR[project.status] }} />
          {project.status}
        </span>
      </div>

      <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-extrabold text-[var(--color-text)] mb-4 leading-tight">
        {project.title}
      </h1>

      {project.summary && (
        <p className="text-muted text-lg leading-relaxed mb-8">{project.summary}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-10">
        {project.tech_stack.map(t => <Tag key={t} color="gray">{t}</Tag>)}
      </div>

      {(project.repo_url || project.demo_url) && (
        <div className="flex gap-3 mb-10">
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border px-5 py-2.5 rounded-lg text-sm text-[var(--color-text)] hover:border-accent transition-colors"
            >
              View Repository →
            </a>
          )}
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
            >
              Live Demo →
            </a>
          )}
        </div>
      )}

      {project.body && (
        <div
          className="prose prose-invert max-w-none text-muted leading-relaxed"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {project.body}
        </div>
      )}
    </article>
  )
}
