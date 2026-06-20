// src/app/api/admin/sections/route.ts
// POST creates a new section (the "Add new block" capability). GET lists all
// sections for the admin (same data as adminGetAllSections, exposed as an
// API in case the dashboard ever needs client-side refetching via SWR).

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetAllSections } from '@/services'
import { createClient } from '@/lib/supabase/server'
import { SECTION_TYPE_META } from '@/components/blocks/registry'

const createSchema = z.object({
  section_type: z.string(),
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
    await requireRole('editor')
    const sections = await adminGetAllSections()
    return successResponse(sections)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('editor')
    const body = createSchema.parse(await req.json())

    if (!SECTION_TYPE_META[body.section_type]) {
      return errorResponse(`Unknown section type: ${body.section_type}`, 422)
    }

    const supabase = await createClient()

    // New sections go to the end of the order
    const { data: maxOrderRow } = await supabase
      .from('sections').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
    const nextOrder = (maxOrderRow?.sort_order ?? -1) + 1

    const { data, error } = await supabase.from('sections').insert({
      slug: body.slug,
      section_type: body.section_type as any,
      label: body.label,
      is_visible: true,
      sort_order: nextOrder,
      content: DEFAULT_CONTENT_BY_TYPE[body.section_type] ?? {},
      translations: {},
      layout_config: {},
      created_by: user.id,
    } as any).select().single()

    if (error) throw error
    return successResponse(data, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
