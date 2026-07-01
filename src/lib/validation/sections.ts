// src/lib/validation/sections.ts
// Zod schemas for every section type's content JSONB.
// These are the enforcement layer at the API boundary — the DB stores raw JSON,
// the API validates it here before writing or serving.

import { z } from 'zod'
import type { SectionType } from '@/types/database'

// ── Shared primitives ────────────────────────────────────────────────────────
const statSchema = z.object({ label: z.string(), value: z.string() })
const interestSchema = z.object({ icon: z.string().max(8), name: z.string().max(100), desc: z.string().max(400) })

// ── Per-type schemas ─────────────────────────────────────────────────────────
export const heroContentSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().max(120),
  intro: z.string().max(600),
  badge: z.string().max(80),
  cta1Text: z.string().max(50),
  cta1Link: z.string().max(100),
  cta2Text: z.string().max(50),
  cta2Link: z.string().max(100),
  stats: z.array(statSchema).min(0).max(6),
  backgroundMediaId: z.string().uuid().optional(),
})

export const timelineContentSchema = z.object({
  heading: z.string().max(200),
  subheading: z.string().max(400),
})

export const academicContentSchema = z.object({
  heading: z.string().max(200),
  stats: z.array(z.object({ icon: z.string().max(8), label: z.string(), value: z.string() })),
  researchTags: z.array(z.string().max(60)).max(30),
})

export const projectsSectionSchema = z.object({
  heading: z.string().max(200),
  itemsPerPage: z.number().int().min(1).max(48).default(12),
  filterByFeatured: z.boolean().optional(),
  filterByCategory: z.string().max(80).optional(),
})

export const journalContentSchema = z.object({
  heading: z.string().max(200),
  principles: z.array(z.string().max(300)).max(20),
  postsPerPage: z.number().int().min(1).max(24).optional(),
})

export const interestsContentSchema = z.object({
  heading: z.string().max(200),
  items: z.array(interestSchema).min(1).max(24),
})

export const visionContentSchema = z.object({
  heading: z.string().max(200),
  universities: z.array(z.string().max(100)).max(20),
  career: z.string().max(600),
  impact: z.string().max(600),
})

export const quotesSectionSchema = z.object({
  heading: z.string().max(200),
  layout: z.enum(['grid', 'carousel', 'list']).optional(),
})

export const galleryContentSchema = z.object({
  heading: z.string().max(200),
  mediaIds: z.array(z.string().uuid()).max(200),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
})

export const aiAssistantContentSchema = z.object({
  heading: z.string().max(200),
  subheading: z.string().max(400),
  suggestions: z.array(z.string().max(120)).max(8),
  systemPromptOverride: z.string().max(4000).optional(),
})

export const blogListContentSchema = z.object({
  heading: z.string().max(200),
  postsPerPage: z.number().int().min(1).max(24).optional(),
})

export const customHtmlContentSchema = z.object({
  heading: z.string().max(200).optional(),
  html: z.string().max(50000),
})

export const customRichTextContentSchema = z.object({
  heading: z.string().max(200).optional(),
  body: z.string().max(100000),
})

// ── Registry map ─────────────────────────────────────────────────────────────
const sectionSchemaMap: Record<SectionType, z.ZodTypeAny> = {
  hero: heroContentSchema,
  timeline: timelineContentSchema,
  academic: academicContentSchema,
  projects: projectsSectionSchema,
  journal: journalContentSchema,
  interests: interestsContentSchema,
  vision: visionContentSchema,
  quotes: quotesSectionSchema,
  gallery: galleryContentSchema,
  ai_assistant: aiAssistantContentSchema,
  blog_list: blogListContentSchema,
  custom_html: customHtmlContentSchema,
  custom_rich_text: customRichTextContentSchema,
}

export function validateSectionContent(type: SectionType, content: unknown) {
  const schema = sectionSchemaMap[type]
  if (!schema) throw new Error(`Unknown section type: ${type}`)
  return schema.safeParse(content)
}

// ── Other entity schemas ──────────────────────────────────────────────────────
export const projectSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(500).optional(),
  body: z.string().max(100000).optional(),
  category: z.string().max(80).default('General'),
  tags: z.array(z.string().max(60)).max(20).default([]),
  tech_stack: z.array(z.string().max(60)).max(30).default([]),
  status: z.enum(['planned','active','completed','on_hold','archived']).default('planned'),
  content_status: z.enum(['draft','published','archived']).default('draft'),
  repo_url: z.string().url().optional().or(z.literal('')),
  demo_url: z.string().url().optional().or(z.literal('')),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
})

export const achievementSchema = z.object({
  kind: z.enum(['certificate','scholarship','competition','award']),
  title: z.string().min(1).max(200),
  issuer: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  rank_or_result: z.string().max(100).optional(),
  awarded_on: z.string().optional(),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  content_status: z.enum(['draft','published','archived']).default('published'),
})

export const timelineEventSchema = z.object({
  year: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  category: z.string().max(50).default('life'),
  icon: z.string().max(8).optional(),
  is_milestone: z.boolean().default(false),
  is_future: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  content_status: z.enum(['draft','published','archived']).default('published'),
})

export const blogPostSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().max(200000).optional(),
  category: z.string().max(80).default('thoughts'),
  tags: z.array(z.string().max(60)).max(20).default([]),
  content_status: z.enum(['draft','published','archived']).default('draft'),
  is_featured: z.boolean().default(false),
  seo_title: z.string().max(70).optional(),
  seo_description: z.string().max(160).optional(),
})

export const quoteSchema = z.object({
  text: z.string().min(1).max(1000),
  author: z.string().max(100).default('Ismail Safwan'),
  source: z.string().max(200).optional(),
  category: z.string().max(80).default('general'),
  is_personal: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  content_status: z.enum(['draft','published','archived']).default('published'),
})

export const aiKnowledgeEntrySchema = z.object({
  title: z.string().min(1).max(200),
  source_type: z.enum(['manual_note','uploaded_document','site_content_sync','url_import']),
  raw_content: z.string().max(500000).optional(),
  source_url: z.string().url().optional(),
  tags: z.array(z.string().max(60)).max(20).default([]),
  notes: z.string().max(1000).optional(),
  is_active: z.boolean().default(true),
})
