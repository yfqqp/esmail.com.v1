// src/components/blocks/section-meta.ts
// Pure, client-safe metadata describing each section_type: icon, label,
// description. Zero imports beyond TypeScript types — no React, no
// services, no database, nothing server-only.
//
// This file exists ONLY because of a real Next.js/webpack constraint:
// JavaScript module imports are file-level, not export-level. A Client
// Component that imports even one named export from a file pulls in that
// file's ENTIRE top-level import graph, including imports it never
// actually calls at runtime. The old registry.tsx exported both this
// metadata (needed by SectionManagerClient, a Client Component) AND the
// async RenderSection function (which imports @/services → @/lib/db/pool
// → the `pg` package). Any Client Component importing SECTION_TYPE_META
// from that file therefore dragged the entire `pg` dependency graph
// (fs, dns, net, tls — all Node-only) into the client bundle, which is
// exactly the Vercel build failure this file fixes.
//
// Rule going forward: anything a Client Component needs from the block
// system must live here, not in registry.tsx. registry.tsx is permitted
// to import this file (one-directional), never the other way around.

import type { SectionType } from '@/types'

// All valid section_type values as a const tuple. Used by:
//   1. SECTION_TYPE_META (the Record below, keyed by this union)
//   2. z.enum(SECTION_TYPES) in the admin API route, so that Zod infers
//      body.section_type as SectionType rather than plain string.
// Keeping both in this file means they can never drift out of sync —
// TypeScript will error if a key is added to one but not the other.
export const SECTION_TYPES = [
  'hero', 'timeline', 'academic', 'projects', 'journal',
  'interests', 'vision', 'quotes', 'gallery', 'blog_list',
  'ai_assistant', 'custom_html', 'custom_rich_text',
] as const satisfies readonly SectionType[]

export const SECTION_TYPE_META: Record<SectionType, { icon: string; label: string; description: string }> = {
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
