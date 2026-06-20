// src/components/blocks/registry.tsx
// The dynamic rendering engine. Given a Section row, this module decides
// which component to mount and what additional data (if any) that block
// type needs fetched from its dedicated table. This is the ONLY place in
// the codebase that maps section_type → component — adding a new block
// type means adding one entry here, never touching the page that renders
// the homepage.

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
          <div dangerouslySetInnerHTML={{ __html: content.html ?? '' }} />
        </section>
      )
    }

    case 'custom_rich_text': {
      const content = section.content as { heading?: string; body?: string }
      return (
        <section id={section.slug} className="max-w-[1200px] mx-auto py-20 px-6 prose prose-invert max-w-none">
          {content.heading && <h2 className="font-display">{content.heading}</h2>}
          <div dangerouslySetInnerHTML={{ __html: content.body ?? '' }} />
        </section>
      )
    }

    default:
      // Forward-compatible: unknown future section_type renders nothing
      // rather than crashing the page, so a partial deploy never 500s.
      return null
  }
}

// ── Metadata registry used by the admin Section Manager UI ─────────────────
// (icons, friendly names, default content templates for "Add Section")
export const SECTION_TYPE_META: Record<string, { icon: string; label: string; description: string }> = {
  hero:              { icon: '🏠', label: 'Hero',           description: 'Top-of-page introduction with stats and CTAs' },
  timeline:          { icon: '📍', label: 'Timeline',       description: 'Chronological life/career milestones' },
  academic:          { icon: '🎓', label: 'Academic',       description: 'Stats, research interests, certificates' },
  projects:          { icon: '🔧', label: 'Projects',       description: 'Grid of technical projects' },
  journal:           { icon: '💭', label: 'Journal',        description: 'Personal thoughts and principles' },
  interests:         { icon: '⭐', label: 'Interests',      description: 'Hobbies and areas of interest' },
  vision:            { icon: '🚀', label: 'Vision',         description: 'Future goals and aspirations' },
  quotes:            { icon: '💬', label: 'Quotes',         description: 'Favorite quotes and principles' },
  gallery:           { icon: '🖼️', label: 'Gallery',        description: 'Photo/media grid' },
  blog_list:         { icon: '📝', label: 'Blog List',      description: 'List of recent blog posts' },
  ai_assistant:      { icon: '🤖', label: 'AI Assistant',   description: 'Interactive AI chat widget' },
  custom_html:       { icon: '⚙️', label: 'Custom HTML',    description: 'Raw HTML block for advanced use' },
  custom_rich_text:  { icon: '📄', label: 'Rich Text',      description: 'Free-form rich text content block' },
}
