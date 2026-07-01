// src/app/api/admin/sections/route.ts
// POST creates a new section (the "Add new block" capability). GET lists all
// sections for the admin dashboard.

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetAllSections, adminCreateSection } from '@/services'
import { SECTION_TYPE_META, SECTION_TYPES } from '@/components/blocks/section-meta'

const createSchema = z.object({
  section_type: z.enum(SECTION_TYPES),
  label: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
})

const DEFAULT_CONTENT_BY_TYPE: Record<string, unknown> = {
  hero: { name: 'Your Name', role: 'Your Role', intro: 'A short introduction.', badge: 'Status', cta1Text: 'Learn More', cta1Link: 'story', cta2Text: 'Contact', cta2Link: 'ai-assistant', stats: [] },
  timeline: { heading: 'New Timeline', subheading: 'A subheading.' },
  academic: { heading: 'Academic', stats: [], researchTags: [] },
  projects: { heading: 'Projects', itemsPerPage: 12 },
  journal: { heading: 'Thoughts', principles: [] },
  interests: { heading: 'Interests', items: [] },
  vision: { heading: 'Vision', universities: [], career: '', impact: '' },
  quotes: { heading: 'Quotes' },
  gallery: { heading: 'Gallery', mediaIds: [] },
  ai_assistant: { heading: 'AI Assistant', subheading: 'Ask me anything.', suggestions: [] },
  blog_list: { heading: 'Blog' },
  custom_html: { html: '<p>Custom content</p>' },
  custom_rich_text: { body: 'Custom rich text content.' },
}

export async function GET() {
  try {
    await requireAuth()
    const sections = await adminGetAllSections()
    return successResponse(sections)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = createSchema.parse(await req.json())

    if (!SECTION_TYPE_META[body.section_type]) {
      return errorResponse(`Unknown section type: ${body.section_type}`, 422)
    }

    const section = await adminCreateSection({
      slug: body.slug,
      section_type: body.section_type,
      label: body.label,
      content: DEFAULT_CONTENT_BY_TYPE[body.section_type] ?? {},
    })

    return successResponse(section, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
