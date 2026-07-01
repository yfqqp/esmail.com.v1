// src/components/blocks/registry.tsx
// The dynamic rendering engine. Given a Section row, this module decides
// which component to mount and what additional data (if any) that block
// type needs fetched from its dedicated table. This is the ONLY place in
// the codebase that maps section_type → component — adding a new block
// type means adding one entry here, never touching the page that renders
// the homepage.
//
// SERVER-ONLY FILE — DO NOT IMPORT FROM CLIENT COMPONENTS.
// This file imports @/services, which imports @/lib/db/pool, which imports
// the `pg` package (Node-only: fs, dns, net, tls). Any Client Component
// that imports anything from this file — even a single named export that
// itself has no server dependency — will pull this entire module's import
// graph into the client bundle, since JS imports are file-level, not
// export-level. This caused a real Vercel build failure (`pg` ended up in
// a Client Component's bundle via SECTION_TYPE_META, which has since been
// moved to ./section-meta.ts, a zero-dependency file safe for client use).
// If a Client Component needs something from the block system, add it to
// section-meta.ts instead — never re-introduce a client-importable export
// here.

import type { Section } from '@/types'
import {
  getPublishedProjects,
  getPublishedAchievements,
  getPublishedTimelineEvents,
  getPublishedBlogPosts,
  getPublishedQuotes,
  getMediaItems,
} from '@/services'

import { HeroBlock } from './HeroBlock'
import { TimelineBlock } from './TimelineBlock'
import { AcademicBlock } from './AcademicBlock'
import { ProjectsBlock } from './ProjectsBlock'
import { JournalBlock } from './JournalBlock'
import { InterestsBlock } from './InterestsBlock'
import { VisionBlock } from './VisionBlock'
import { QuotesBlock } from './QuotesBlock'
import { GalleryBlock } from './GalleryBlock'
import { AIAssistantBlock } from './AIAssistantBlock'
import { sanitizeHtml } from '@/lib/utils/sanitize'

/**
 * Renders a single section by dispatching on section_type.
 * Server Component — fetches whatever live relational data the block needs
 * (projects, timeline events, etc.) at render time so content is never stale.
 */
export async function RenderSection({ section, locale }: { section: Section; locale: string }) {
  switch (section.section_type) {
    case 'hero':
      return <HeroBlock section={section} />

    case 'timeline': {
      const events = await getPublishedTimelineEvents()
      return <TimelineBlock section={section} events={events} />
    }

    case 'academic': {
      const achievements = await getPublishedAchievements()
      return <AcademicBlock section={section} achievements={achievements} />
    }

    case 'projects': {
      const { data: projects } = await getPublishedProjects({ limit: 24 })
      return <ProjectsBlock section={section} projects={projects} locale={locale} />
    }

    case 'journal': {
      const { data: posts } = await getPublishedBlogPosts({ limit: 6 })
      return <JournalBlock section={section} posts={posts} locale={locale} />
    }

    case 'interests':
      return <InterestsBlock section={section} />

    case 'vision':
      return <VisionBlock section={section} />

    case 'quotes': {
      const quotes = await getPublishedQuotes()
      return <QuotesBlock section={section} quotes={quotes} />
    }

    case 'gallery': {
      const content = section.content as { mediaIds?: string[] }
      const { data: allMedia } = await getMediaItems({ kind: 'image', limit: 60 })
      const filtered = content.mediaIds?.length
        ? allMedia.filter(m => content.mediaIds!.includes(m.id))
        : allMedia
      return <GalleryBlock section={section} media={filtered} />
    }

    case 'ai_assistant':
      return <AIAssistantBlock section={section} />

    case 'blog_list': {
      const { data: posts } = await getPublishedBlogPosts({ limit: 9 })
      return <JournalBlock section={section} posts={posts} locale={locale} />
    }

    case 'custom_html': {
      const content = section.content as { html?: string }
      return (
        <section id={section.slug} className="max-w-[1200px] mx-auto py-20 px-6">
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.html ?? '') }} />
        </section>
      )
    }

    case 'custom_rich_text': {
      const content = section.content as { heading?: string; body?: string }
      return (
        <section id={section.slug} className="max-w-[1200px] mx-auto py-20 px-6 prose prose-invert max-w-none">
          {content.heading && <h2 className="font-display">{content.heading}</h2>}
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.body ?? '') }} />
        </section>
      )
    }

    default:
      // Forward-compatible: unknown future section_type renders nothing
      // rather than crashing the page, so a partial deploy never 500s.
      return null
  }
}
