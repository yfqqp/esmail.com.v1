// src/services/index.ts
// All database query functions. Uses the direct Postgres pool (src/lib/db/pool.ts)
// instead of the Supabase SDK, since this project no longer uses Supabase Auth.
// Every function here assumes the caller (an API route) has already verified
// requireAuth() for any mutating operation — these functions do not re-check
// auth themselves, matching the "RLS denies all public writes; the API layer
// is the real gate" model established in migration 013.

import { query, queryOne } from '@/lib/db/pool'
import type {
  Section, Project, Achievement, TimelineEvent, BlogPost, Quote,
  NavigationItem, ThemeSettings, SiteSetting, AIKnowledgeEntry,
  MediaItem, SEOSettings, FilterState, PaginatedResult
} from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════════════════

// NOTE: locale-specific section translations (the `translations` JSONB
// column on each section) are not yet wired into rendering anywhere in this
// codebase — only static UI strings (nav labels, buttons) are localized via
// next-intl's messages/*.json. This function intentionally does not take a
// locale parameter yet; the homepage passes one in anticipation of that
// future wiring, which is out of scope for this pass.
export async function getPublicSections(): Promise<Section[]> {
  return query<Section>(
    `select * from public.sections where is_visible = true order by sort_order`
  )
}

export async function adminGetAllSections(): Promise<Section[]> {
  return query<Section>(`select * from public.sections order by sort_order`)
}

export async function adminUpdateSection(
  id: string,
  patch: Partial<Pick<Section, 'label' | 'is_visible' | 'sort_order' | 'content' | 'translations' | 'layout_config'>>
): Promise<Section> {
  const sets: string[] = []
  const values: unknown[] = []
  let i = 1

  for (const [key, value] of Object.entries(patch)) {
    sets.push(`${key} = $${i}`)
    values.push(typeof value === 'object' ? JSON.stringify(value) : value)
    i++
  }
  values.push(id)

  const row = await queryOne<Section>(
    `update public.sections set ${sets.join(', ')}, updated_at = now() where id = $${i} returning *`,
    values
  )
  if (!row) throw new Error('Section not found')
  return row
}

export async function adminReorderSections(sectionIds: string[]): Promise<void> {
  // Mirrors the two-phase shift used by the old reorder_sections() SQL
  // function (migration 005) to avoid colliding with the unique partial
  // index on sort_order while visible.
  await query(`update public.sections set sort_order = sort_order + 100000`)
  for (let i = 0; i < sectionIds.length; i++) {
    await query(`update public.sections set sort_order = $1 where id = $2`, [i, sectionIds[i]])
  }
}

export async function adminCreateSection(input: {
  slug: string; section_type: string; label: string; content: unknown
}): Promise<Section> {
  const maxRow = await queryOne<{ max: number }>(`select coalesce(max(sort_order), -1) as max from public.sections`)
  const nextOrder = (maxRow?.max ?? -1) + 1

  const row = await queryOne<Section>(
    `insert into public.sections (slug, section_type, label, is_visible, sort_order, content, translations, layout_config)
     values ($1, $2, $3, true, $4, $5, '{}'::jsonb, '{}'::jsonb)
     returning *`,
    [input.slug, input.section_type, input.label, nextOrder, JSON.stringify(input.content)]
  )
  if (!row) throw new Error('Failed to create section')
  return row
}

export async function adminDeleteSection(id: string): Promise<void> {
  await query(`delete from public.sections where id = $1`, [id])
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════════════════

export async function getPublishedProjects(opts?: {
  featured?: boolean; category?: string; limit?: number; offset?: number
}): Promise<{ data: Project[]; count: number }> {
  const conditions = [`content_status = 'published'`]
  const values: unknown[] = []
  let i = 1

  if (opts?.featured) { conditions.push(`is_featured = true`) }
  if (opts?.category) { conditions.push(`category = $${i}`); values.push(opts.category); i++ }

  const where = conditions.join(' and ')
  const countRow = await queryOne<{ count: string }>(
    `select count(*) from public.projects where ${where}`, values
  )

  let sql = `select * from public.projects where ${where} order by sort_order`
  if (opts?.limit) { sql += ` limit $${i}`; values.push(opts.limit); i++ }
  if (opts?.offset) { sql += ` offset $${i}`; values.push(opts.offset); i++ }

  const data = await query<Project>(sql, values)
  return { data, count: Number(countRow?.count ?? 0) }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return queryOne<Project>(
    `select * from public.projects where slug = $1 and content_status = 'published'`,
    [slug]
  )
}

export async function adminGetProjects(filters: FilterState): Promise<PaginatedResult<Project>> {
  const conditions: string[] = ['true']
  const values: unknown[] = []
  let i = 1

  if (filters.search) { conditions.push(`title ilike $${i}`); values.push(`%${filters.search}%`); i++ }
  if (filters.status) { conditions.push(`content_status = $${i}`); values.push(filters.status); i++ }
  if (filters.category) { conditions.push(`category = $${i}`); values.push(filters.category); i++ }

  const where = conditions.join(' and ')
  const countRow = await queryOne<{ count: string }>(`select count(*) from public.projects where ${where}`, values)

  const sortBy = filters.sortBy ?? 'sort_order'
  const sortDir = filters.sortDir === 'desc' ? 'desc' : 'asc'
  const from = (filters.page - 1) * filters.pageSize

  const data = await query<Project>(
    `select * from public.projects where ${where} order by ${sortBy} ${sortDir} limit $${i} offset $${i + 1}`,
    [...values, filters.pageSize, from]
  )

  const count = Number(countRow?.count ?? 0)
  return { data, count, page: filters.page, pageSize: filters.pageSize, totalPages: Math.ceil(count / filters.pageSize) }
}

export async function adminUpsertProject(project: Partial<Project> & Pick<Project, 'title'>): Promise<Project> {
  if (project.id) {
    const { id, ...patch } = project
    const sets: string[] = []
    const values: unknown[] = []
    let i = 1
    for (const [key, value] of Object.entries(patch)) {
      sets.push(`${key} = $${i}`)
      values.push(Array.isArray(value) || (typeof value === 'object' && value !== null) ? JSON.stringify(value) : value)
      i++
    }
    values.push(id)
    const row = await queryOne<Project>(
      `update public.projects set ${sets.join(', ')}, updated_at = now() where id = $${i} returning *`,
      values
    )
    if (!row) throw new Error('Project not found')
    return row
  }

  const slug = (project.title ?? 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const row = await queryOne<Project>(
    `insert into public.projects (slug, title, summary, body, category, tags, tech_stack, status, content_status, repo_url, demo_url, is_featured)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning *`,
    [
      `${slug}-${Date.now().toString(36)}`,
      project.title, project.summary ?? null, project.body ?? null,
      project.category ?? 'General', project.tags ?? [], project.tech_stack ?? [],
      project.status ?? 'planned', project.content_status ?? 'draft',
      project.repo_url || null, project.demo_url || null, project.is_featured ?? false,
    ]
  )
  if (!row) throw new Error('Failed to create project')
  return row
}

export async function adminDeleteProject(id: string): Promise<void> {
  await query(`delete from public.projects where id = $1`, [id])
}

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function getPublishedAchievements(kind?: string): Promise<Achievement[]> {
  if (kind) {
    return query<Achievement>(
      `select * from public.achievements where content_status = 'published' and kind = $1 order by sort_order`,
      [kind]
    )
  }
  return query<Achievement>(`select * from public.achievements where content_status = 'published' order by sort_order`)
}

export async function adminGetAllAchievements(): Promise<Achievement[]> {
  return query<Achievement>(`select * from public.achievements order by sort_order`)
}

export async function adminUpsertAchievement(a: Partial<Achievement> & Pick<Achievement, 'title' | 'kind'>): Promise<Achievement> {
  if (a.id) {
    const { id, ...patch } = a
    const sets: string[] = []
    const values: unknown[] = []
    let i = 1
    for (const [key, value] of Object.entries(patch)) {
      sets.push(`${key} = $${i}`)
      values.push(Array.isArray(value) ? value : value)
      i++
    }
    values.push(id)
    const row = await queryOne<Achievement>(
      `update public.achievements set ${sets.join(', ')}, updated_at = now() where id = $${i} returning *`,
      values
    )
    if (!row) throw new Error('Achievement not found')
    return row
  }

  const row = await queryOne<Achievement>(
    `insert into public.achievements (kind, title, issuer, description, rank_or_result, awarded_on, is_featured, content_status)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
    [a.kind, a.title, a.issuer ?? null, a.description ?? null, a.rank_or_result ?? null,
     a.awarded_on || null, a.is_featured ?? false, a.content_status ?? 'published']
  )
  if (!row) throw new Error('Failed to create achievement')
  return row
}

export async function adminDeleteAchievement(id: string): Promise<void> {
  await query(`delete from public.achievements where id = $1`, [id])
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE
// ═══════════════════════════════════════════════════════════════════════════

export async function getPublishedTimelineEvents(): Promise<TimelineEvent[]> {
  return query<TimelineEvent>(`select * from public.timeline_events where content_status = 'published' order by sort_order`)
}

export async function adminGetAllTimelineEvents(): Promise<TimelineEvent[]> {
  return query<TimelineEvent>(`select * from public.timeline_events order by sort_order`)
}

export async function adminUpsertTimelineEvent(e: Partial<TimelineEvent> & Pick<TimelineEvent, 'title' | 'year'>): Promise<TimelineEvent> {
  if (e.id) {
    const { id, ...patch } = e
    const sets: string[] = []
    const values: unknown[] = []
    let i = 1
    for (const [key, value] of Object.entries(patch)) { sets.push(`${key} = $${i}`); values.push(value); i++ }
    values.push(id)
    const row = await queryOne<TimelineEvent>(
      `update public.timeline_events set ${sets.join(', ')}, updated_at = now() where id = $${i} returning *`,
      values
    )
    if (!row) throw new Error('Timeline event not found')
    return row
  }

  const row = await queryOne<TimelineEvent>(
    `insert into public.timeline_events (year, title, body, category, is_milestone, is_future, content_status)
     values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [e.year, e.title, e.body ?? null, e.category ?? 'life', e.is_milestone ?? false, e.is_future ?? false, e.content_status ?? 'published']
  )
  if (!row) throw new Error('Failed to create timeline event')
  return row
}

export async function adminDeleteTimelineEvent(id: string): Promise<void> {
  await query(`delete from public.timeline_events where id = $1`, [id])
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOG
// ═══════════════════════════════════════════════════════════════════════════

export async function getPublishedBlogPosts(opts?: {
  limit?: number; offset?: number; category?: string; tag?: string
}): Promise<{ data: BlogPost[]; count: number }> {
  const conditions = [`content_status = 'published'`]
  const values: unknown[] = []
  let i = 1

  if (opts?.category) { conditions.push(`category = $${i}`); values.push(opts.category); i++ }
  if (opts?.tag) { conditions.push(`$${i} = any(tags)`); values.push(opts.tag); i++ }

  const where = conditions.join(' and ')
  const countRow = await queryOne<{ count: string }>(`select count(*) from public.blog_posts where ${where}`, values)

  let sql = `select * from public.blog_posts where ${where} order by published_at desc nulls last`
  if (opts?.limit) { sql += ` limit $${i}`; values.push(opts.limit); i++ }
  if (opts?.offset) { sql += ` offset $${i}`; values.push(opts.offset); i++ }

  const data = await query<BlogPost>(sql, values)
  return { data, count: Number(countRow?.count ?? 0) }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return queryOne<BlogPost>(`select * from public.blog_posts where slug = $1 and content_status = 'published'`, [slug])
}

export async function adminGetAllBlogPosts(): Promise<BlogPost[]> {
  return query<BlogPost>(`select * from public.blog_posts order by created_at desc`)
}

export async function adminUpsertBlogPost(post: Partial<BlogPost> & Pick<BlogPost, 'title'>): Promise<BlogPost> {
  if (post.id) {
    const { id, ...patch } = post
    const sets: string[] = []
    const values: unknown[] = []
    let i = 1
    for (const [key, value] of Object.entries(patch)) { sets.push(`${key} = $${i}`); values.push(value); i++ }
    values.push(id)
    const row = await queryOne<BlogPost>(
      `update public.blog_posts set ${sets.join(', ')}, updated_at = now() where id = $${i} returning *`,
      values
    )
    if (!row) throw new Error('Blog post not found')
    return row
  }

  const slug = (post.title ?? 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const row = await queryOne<BlogPost>(
    `insert into public.blog_posts (slug, title, excerpt, content, category, tags, content_status, is_featured, published_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
    [
      `${slug}-${Date.now().toString(36)}`,
      post.title, post.excerpt ?? null, post.content ?? null,
      post.category ?? 'thoughts', post.tags ?? [], post.content_status ?? 'draft',
      post.is_featured ?? false, post.content_status === 'published' ? new Date().toISOString() : null,
    ]
  )
  if (!row) throw new Error('Failed to create blog post')
  return row
}

export async function adminDeleteBlogPost(id: string): Promise<void> {
  await query(`delete from public.blog_posts where id = $1`, [id])
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTES
// ═══════════════════════════════════════════════════════════════════════════

export async function getPublishedQuotes(): Promise<Quote[]> {
  return query<Quote>(`select * from public.quotes where content_status = 'published' order by sort_order`)
}

export async function adminGetAllQuotes(): Promise<Quote[]> {
  return query<Quote>(`select * from public.quotes order by sort_order`)
}

export async function adminUpsertQuote(q: Partial<Quote> & Pick<Quote, 'text'>): Promise<Quote> {
  if (q.id) {
    const { id, ...patch } = q
    const sets: string[] = []
    const values: unknown[] = []
    let i = 1
    for (const [key, value] of Object.entries(patch)) { sets.push(`${key} = $${i}`); values.push(value); i++ }
    values.push(id)
    const row = await queryOne<Quote>(
      `update public.quotes set ${sets.join(', ')}, updated_at = now() where id = $${i} returning *`,
      values
    )
    if (!row) throw new Error('Quote not found')
    return row
  }

  const row = await queryOne<Quote>(
    `insert into public.quotes (text, author, category, is_personal, is_featured, content_status)
     values ($1, $2, $3, $4, $5, $6) returning *`,
    [q.text, q.author ?? 'Ismail Safwan', q.category ?? 'general', q.is_personal ?? false, q.is_featured ?? false, q.content_status ?? 'published']
  )
  if (!row) throw new Error('Failed to create quote')
  return row
}

export async function adminDeleteQuote(id: string): Promise<void> {
  await query(`delete from public.quotes where id = $1`, [id])
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA
// ═══════════════════════════════════════════════════════════════════════════

export async function getMediaItems(opts?: {
  kind?: string; folder?: string; search?: string; limit?: number; offset?: number
}): Promise<{ data: MediaItem[]; count: number }> {
  const conditions = ['true']
  const values: unknown[] = []
  let i = 1

  if (opts?.kind) { conditions.push(`kind = $${i}`); values.push(opts.kind); i++ }
  if (opts?.folder) { conditions.push(`folder = $${i}`); values.push(opts.folder); i++ }
  if (opts?.search) { conditions.push(`title ilike $${i}`); values.push(`%${opts.search}%`); i++ }

  const where = conditions.join(' and ')
  const countRow = await queryOne<{ count: string }>(`select count(*) from public.media_items where ${where}`, values)

  let sql = `select * from public.media_items where ${where} order by created_at desc`
  if (opts?.limit) { sql += ` limit $${i}`; values.push(opts.limit); i++ }
  if (opts?.offset) { sql += ` offset $${i}`; values.push(opts.offset); i++ }

  const data = await query<MediaItem>(sql, values)
  return { data, count: Number(countRow?.count ?? 0) }
}

export async function saveMediaItem(item: Omit<MediaItem, 'id' | 'created_at' | 'updated_at'>): Promise<MediaItem> {
  const row = await queryOne<MediaItem>(
    `insert into public.media_items (kind, title, alt_text, description, cloudinary_public_id, secure_url, format, bytes, width, height, duration_seconds, tags, folder)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) returning *`,
    [item.kind, item.title, item.alt_text, item.description, item.cloudinary_public_id, item.secure_url,
     item.format, item.bytes, item.width, item.height, item.duration_seconds, item.tags, item.folder]
  )
  if (!row) throw new Error('Failed to save media item')
  return row
}

export async function deleteMediaItem(id: string): Promise<void> {
  await query(`delete from public.media_items where id = $1`, [id])
}

export async function getMediaItemById(id: string): Promise<MediaItem | null> {
  return queryOne<MediaItem>(`select * from public.media_items where id = $1`, [id])
}

export async function updateMediaItem(id: string, patch: Partial<MediaItem>): Promise<MediaItem> {
  const sets: string[] = []
  const values: unknown[] = []
  let i = 1
  for (const [key, value] of Object.entries(patch)) { sets.push(`${key} = $${i}`); values.push(value); i++ }
  values.push(id)
  const row = await queryOne<MediaItem>(
    `update public.media_items set ${sets.join(', ')}, updated_at = now() where id = $${i} returning *`,
    values
  )
  if (!row) throw new Error('Media item not found')
  return row
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS / THEME / NAV / SEO
// ═══════════════════════════════════════════════════════════════════════════

export async function getActiveTheme(): Promise<ThemeSettings | null> {
  return queryOne<ThemeSettings>(`select * from public.theme_settings where is_active = true`)
}

export async function adminUpdateTheme(patch: Partial<Pick<ThemeSettings, 'colors' | 'typography' | 'spacing'>>): Promise<ThemeSettings> {
  const active = await getActiveTheme()
  if (!active) throw new Error('No active theme found')

  const merged = {
    colors: { ...active.colors, ...(patch.colors ?? {}) },
    typography: { ...active.typography, ...(patch.typography ?? {}) },
    spacing: { ...active.spacing, ...(patch.spacing ?? {}) },
  }

  const row = await queryOne<ThemeSettings>(
    `update public.theme_settings set colors = $1, typography = $2, spacing = $3 where id = $4 returning *`,
    [JSON.stringify(merged.colors), JSON.stringify(merged.typography), JSON.stringify(merged.spacing), active.id]
  )
  if (!row) throw new Error('Failed to update theme')
  return row
}

export async function getNavigationItems(): Promise<NavigationItem[]> {
  return query<NavigationItem>(`select * from public.navigation_items where is_visible = true order by sort_order`)
}

export async function adminGetAllNavItems(): Promise<NavigationItem[]> {
  return query<NavigationItem>(`select * from public.navigation_items order by sort_order`)
}

export async function adminCreateNavItem(item: Partial<NavigationItem> & Pick<NavigationItem, 'label' | 'item_type' | 'target'>): Promise<NavigationItem> {
  const maxRow = await queryOne<{ max: number }>(`select coalesce(max(sort_order), -1) as max from public.navigation_items`)
  const row = await queryOne<NavigationItem>(
    `insert into public.navigation_items (label, item_type, target, is_visible, sort_order, open_new_tab, translations)
     values ($1, $2, $3, $4, $5, $6, '{}'::jsonb) returning *`,
    [item.label, item.item_type, item.target, item.is_visible ?? true, (maxRow?.max ?? -1) + 1, item.open_new_tab ?? false]
  )
  if (!row) throw new Error('Failed to create nav item')
  return row
}

export async function adminUpdateNavItem(id: string, patch: Partial<NavigationItem>): Promise<NavigationItem> {
  const sets: string[] = []
  const values: unknown[] = []
  let i = 1
  for (const [key, value] of Object.entries(patch)) { sets.push(`${key} = $${i}`); values.push(value); i++ }
  values.push(id)
  const row = await queryOne<NavigationItem>(
    `update public.navigation_items set ${sets.join(', ')}, updated_at = now() where id = $${i} returning *`,
    values
  )
  if (!row) throw new Error('Nav item not found')
  return row
}

export async function adminDeleteNavItem(id: string): Promise<void> {
  await query(`delete from public.navigation_items where id = $1`, [id])
}

export async function getSiteSettings(): Promise<Record<string, unknown>> {
  const rows = await query<{ key: string; value: unknown }>(`select key, value from public.site_settings`)
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}

export async function adminUpdateSiteSetting(key: string, value: unknown): Promise<void> {
  await query(
    `update public.site_settings set value = $1, updated_at = now() where key = $2`,
    [JSON.stringify(value), key]
  )
}

export async function getSEOSettings(pageKey: string): Promise<SEOSettings | null> {
  return queryOne<SEOSettings>(`select * from public.seo_settings where page_key = $1`, [pageKey])
}

export async function adminGetAllSEOSettings(): Promise<SEOSettings[]> {
  return query<SEOSettings>(`select * from public.seo_settings order by page_key`)
}

export async function adminUpdateSEOSettings(pageKey: string, patch: Partial<SEOSettings>): Promise<SEOSettings> {
  const sets: string[] = []
  const values: unknown[] = []
  let i = 1
  for (const [key, value] of Object.entries(patch)) { sets.push(`${key} = $${i}`); values.push(value); i++ }
  values.push(pageKey)
  const row = await queryOne<SEOSettings>(
    `update public.seo_settings set ${sets.join(', ')}, updated_at = now() where page_key = $${i} returning *`,
    values
  )
  if (!row) throw new Error('SEO settings not found for that page')
  return row
}

// ═══════════════════════════════════════════════════════════════════════════
// AI KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════════════════

export async function adminGetAIEntries(): Promise<AIKnowledgeEntry[]> {
  return query<AIKnowledgeEntry>(`select * from public.ai_knowledge_entries order by created_at desc`)
}

export async function adminCreateAIEntry(
  entry: Omit<AIKnowledgeEntry, 'id' | 'created_at' | 'updated_at' | 'processing_status' | 'chunk_count'>
): Promise<AIKnowledgeEntry> {
  const row = await queryOne<AIKnowledgeEntry>(
    `insert into public.ai_knowledge_entries (title, source_type, raw_content, source_url, tags, is_active, notes, processing_status, chunk_count)
     values ($1, $2, $3, $4, $5, $6, $7, 'pending', 0) returning *`,
    [entry.title, entry.source_type, entry.raw_content, entry.source_url, entry.tags, entry.is_active, entry.notes]
  )
  if (!row) throw new Error('Failed to create AI knowledge entry')
  return row
}

export async function adminUpdateAIEntry(id: string, patch: Partial<AIKnowledgeEntry>): Promise<AIKnowledgeEntry> {
  const sets: string[] = []
  const values: unknown[] = []
  let i = 1
  for (const [key, value] of Object.entries(patch)) { sets.push(`${key} = $${i}`); values.push(value); i++ }
  values.push(id)
  const row = await queryOne<AIKnowledgeEntry>(
    `update public.ai_knowledge_entries set ${sets.join(', ')}, updated_at = now() where id = $${i} returning *`,
    values
  )
  if (!row) throw new Error('AI knowledge entry not found')
  return row
}

export async function adminDeleteAIEntry(id: string): Promise<void> {
  await query(`delete from public.ai_knowledge_entries where id = $1`, [id])
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export async function trackEvent(event: {
  event_type: string; page_path: string; referrer?: string
  session_id?: string; metadata?: Record<string, unknown>
}): Promise<void> {
  await query(
    `insert into public.analytics_events (event_type, page_path, referrer, session_id, metadata)
     values ($1, $2, $3, $4, $5)`,
    [event.event_type, event.page_path, event.referrer ?? null, event.session_id ?? null, JSON.stringify(event.metadata ?? {})]
  )
}

export async function adminGetAnalyticsSummary(): Promise<{
  totalViews: number; uniqueSessions: number
  topPages: Array<{ page_path: string; event_count: number }>
  viewsByDay: Array<{ day: string; event_count: number }>
}> {
  const [allRows, topRows, dailyRows] = await Promise.all([
    query<{ event_count: number; unique_sessions: number }>(
      `select event_count, unique_sessions from public.analytics_daily_summary where event_type = 'page_view'`
    ),
    query<{ page_path: string; event_count: number }>(
      `select page_path, event_count from public.analytics_daily_summary where event_type = 'page_view' order by event_count desc limit 10`
    ),
    query<{ day: string; event_count: number }>(
      `select day, event_count from public.analytics_daily_summary where event_type = 'page_view' order by day desc limit 30`
    ),
  ])

  return {
    totalViews: allRows.reduce((sum, r) => sum + (r.event_count ?? 0), 0),
    uniqueSessions: allRows.reduce((sum, r) => sum + (r.unique_sessions ?? 0), 0),
    topPages: topRows,
    viewsByDay: dailyRows,
  }
}

export async function refreshAnalyticsSummary(): Promise<void> {
  await query(`select public.refresh_analytics_summary()`)
}
