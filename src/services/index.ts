// src/services/index.ts
// All server-side data access functions. Import in Server Components and
// Route Handlers. Every function uses the server Supabase client with RLS.
// Functions prefixed `admin*` use service role for admin operations.

import { createClient, createServiceClient } from '@/lib/supabase/server'
import type {
  Section, Project, Achievement, TimelineEvent, BlogPost, Quote,
  NavigationItem, ThemeSettings, SiteSetting, AIKnowledgeEntry,
  MediaItem, SEOSettings, FilterState, PaginatedResult, SectionType
} from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch all visible sections ordered by sort_order. Used by the public site. */
export async function getPublicSections(locale = 'en'): Promise<Section[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order')

  if (error) throw new Error(`getPublicSections: ${error.message}`)
  return data ?? []
}

/** Fetch ALL sections (visible + hidden) for the admin Section Manager. */
export async function adminGetAllSections(): Promise<Section[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('sort_order')

  if (error) throw new Error(`adminGetAllSections: ${error.message}`)
  return data ?? []
}

export async function adminUpdateSection(
  id: string,
  patch: Partial<Pick<Section, 'label' | 'is_visible' | 'sort_order' | 'content' | 'translations' | 'layout_config'>>
): Promise<Section> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sections')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`adminUpdateSection: ${error.message}`)
  return data
}

export async function adminReorderSections(sectionIds: string[]): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('reorder_sections', { section_ids: sectionIds })
  if (error) throw new Error(`adminReorderSections: ${error.message}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════════════════

export async function getPublishedProjects(opts?: {
  featured?: boolean; category?: string; limit?: number; offset?: number
}): Promise<{ data: Project[]; count: number }> {
  const supabase = await createClient()
  let query = supabase.from('projects').select('*', { count: 'exact' })
    .eq('content_status', 'published').order('sort_order')

  if (opts?.featured) query = query.eq('is_featured', true)
  if (opts?.category) query = query.eq('category', opts.category)
  if (opts?.limit) query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(`getPublishedProjects: ${error.message}`)
  return { data: data ?? [], count: count ?? 0 }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('*')
    .eq('slug', slug).eq('content_status', 'published').single()
  return data
}

export async function adminGetProjects(filters: FilterState): Promise<PaginatedResult<Project>> {
  const supabase = await createClient()
  let query = supabase.from('projects').select('*', { count: 'exact' })

  if (filters.search) query = query.ilike('title', `%${filters.search}%`)
  if (filters.status) query = query.eq('content_status', filters.status as any)
  if (filters.category) query = query.eq('category', filters.category)

  const sortBy = (filters.sortBy ?? 'sort_order') as keyof Project
  query = query.order(sortBy as string, { ascending: filters.sortDir !== 'desc' })

  const from = (filters.page - 1) * filters.pageSize
  query = query.range(from, from + filters.pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(`adminGetProjects: ${error.message}`)
  return {
    data: data ?? [], count: count ?? 0, page: filters.page,
    pageSize: filters.pageSize, totalPages: Math.ceil((count ?? 0) / filters.pageSize)
  }
}

export async function adminUpsertProject(
  project: Partial<Project> & Pick<Project, 'title'>
): Promise<Project> {
  const supabase = await createClient()
  const op = project.id
    ? supabase.from('projects').update(project).eq('id', project.id).select().single()
    : supabase.from('projects').insert(project as any).select().single()
  const { data, error } = await op
  if (error) throw new Error(`adminUpsertProject: ${error.message}`)
  return data
}

export async function adminDeleteProject(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(`adminDeleteProject: ${error.message}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function getPublishedAchievements(kind?: string): Promise<Achievement[]> {
  const supabase = await createClient()
  let query = supabase.from('achievements').select('*')
    .eq('content_status', 'published').order('sort_order')
  if (kind) query = query.eq('kind', kind as any)
  const { data, error } = await query
  if (error) throw new Error(`getPublishedAchievements: ${error.message}`)
  return data ?? []
}

export async function adminUpsertAchievement(a: Partial<Achievement> & Pick<Achievement, 'title' | 'kind'>): Promise<Achievement> {
  const supabase = await createClient()
  const op = a.id
    ? supabase.from('achievements').update(a).eq('id', a.id).select().single()
    : supabase.from('achievements').insert(a as any).select().single()
  const { data, error } = await op
  if (error) throw new Error(`adminUpsertAchievement: ${error.message}`)
  return data
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE
// ═══════════════════════════════════════════════════════════════════════════

export async function getPublishedTimelineEvents(): Promise<TimelineEvent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('timeline_events').select('*')
    .eq('content_status', 'published').order('sort_order')
  if (error) throw new Error(`getPublishedTimelineEvents: ${error.message}`)
  return data ?? []
}

export async function adminUpsertTimelineEvent(e: Partial<TimelineEvent> & Pick<TimelineEvent, 'title' | 'year'>): Promise<TimelineEvent> {
  const supabase = await createClient()
  const op = e.id
    ? supabase.from('timeline_events').update(e).eq('id', e.id).select().single()
    : supabase.from('timeline_events').insert(e as any).select().single()
  const { data, error } = await op
  if (error) throw new Error(`adminUpsertTimelineEvent: ${error.message}`)
  return data
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOG
// ═══════════════════════════════════════════════════════════════════════════

export async function getPublishedBlogPosts(opts?: {
  limit?: number; offset?: number; category?: string; tag?: string
}): Promise<{ data: BlogPost[]; count: number }> {
  const supabase = await createClient()
  let query = supabase.from('blog_posts').select('*', { count: 'exact' })
    .eq('content_status', 'published').order('published_at', { ascending: false })

  if (opts?.category) query = query.eq('category', opts.category)
  if (opts?.tag) query = query.contains('tags', [opts.tag])
  if (opts?.limit) query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(`getPublishedBlogPosts: ${error.message}`)
  return { data: data ?? [], count: count ?? 0 }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('blog_posts').select('*')
    .eq('slug', slug).eq('content_status', 'published').single()
  return data
}

export async function adminUpsertBlogPost(post: Partial<BlogPost> & Pick<BlogPost, 'title'>): Promise<BlogPost> {
  const supabase = await createClient()
  const op = post.id
    ? supabase.from('blog_posts').update(post).eq('id', post.id).select().single()
    : supabase.from('blog_posts').insert(post as any).select().single()
  const { data, error } = await op
  if (error) throw new Error(`adminUpsertBlogPost: ${error.message}`)
  return data
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTES
// ═══════════════════════════════════════════════════════════════════════════

export async function getPublishedQuotes(): Promise<Quote[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('quotes').select('*')
    .eq('content_status', 'published').order('sort_order')
  if (error) throw new Error(`getPublishedQuotes: ${error.message}`)
  return data ?? []
}

export async function adminUpsertQuote(q: Partial<Quote> & Pick<Quote, 'text'>): Promise<Quote> {
  const supabase = await createClient()
  const op = q.id
    ? supabase.from('quotes').update(q).eq('id', q.id).select().single()
    : supabase.from('quotes').insert(q as any).select().single()
  const { data, error } = await op
  if (error) throw new Error(`adminUpsertQuote: ${error.message}`)
  return data
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA
// ═══════════════════════════════════════════════════════════════════════════

export async function getMediaItems(opts?: {
  kind?: string; folder?: string; search?: string; limit?: number; offset?: number
}): Promise<{ data: MediaItem[]; count: number }> {
  const supabase = await createClient()
  let query = supabase.from('media_items').select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (opts?.kind) query = query.eq('kind', opts.kind as any)
  if (opts?.folder) query = query.eq('folder', opts.folder)
  if (opts?.search) query = query.ilike('title', `%${opts.search}%`)
  if (opts?.limit) query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(`getMediaItems: ${error.message}`)
  return { data: data ?? [], count: count ?? 0 }
}

export async function saveMediaItem(item: Omit<MediaItem, 'id' | 'created_at' | 'updated_at'>): Promise<MediaItem> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('media_items').insert(item as any).select().single()
  if (error) throw new Error(`saveMediaItem: ${error.message}`)
  return data
}

export async function deleteMediaItem(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('media_items').delete().eq('id', id)
  if (error) throw new Error(`deleteMediaItem: ${error.message}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export async function getActiveTheme(): Promise<ThemeSettings | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('theme_settings').select('*').eq('is_active', true).single()
  return data
}

export async function getNavigationItems(): Promise<NavigationItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('navigation_items').select('*')
    .eq('is_visible', true).order('sort_order')
  if (error) throw new Error(`getNavigationItems: ${error.message}`)
  return data ?? []
}

export async function adminGetAllNavItems(): Promise<NavigationItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('navigation_items').select('*').order('sort_order')
  if (error) throw new Error(`adminGetAllNavItems: ${error.message}`)
  return data ?? []
}

export async function getSiteSettings(): Promise<Record<string, unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('site_settings').select('key, value')
  if (error) throw new Error(`getSiteSettings: ${error.message}`)
  return Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
}

export async function adminUpdateSiteSetting(key: string, value: unknown): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('site_settings')
    .update({ value: value as any, updated_at: new Date().toISOString() })
    .eq('key', key)
  if (error) throw new Error(`adminUpdateSiteSetting: ${error.message}`)
}

export async function getSEOSettings(pageKey: string): Promise<SEOSettings | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('seo_settings').select('*').eq('page_key', pageKey).single()
  return data
}

// ═══════════════════════════════════════════════════════════════════════════
// AI KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════════════════

export async function adminGetAIEntries(): Promise<AIKnowledgeEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('ai_knowledge_entries').select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`adminGetAIEntries: ${error.message}`)
  return data ?? []
}

export async function adminCreateAIEntry(
  entry: Omit<AIKnowledgeEntry, 'id' | 'created_at' | 'updated_at' | 'processing_status' | 'chunk_count'>
): Promise<AIKnowledgeEntry> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('ai_knowledge_entries')
    .insert({ ...entry, processing_status: 'pending', chunk_count: 0 } as any)
    .select().single()
  if (error) throw new Error(`adminCreateAIEntry: ${error.message}`)
  return data
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export async function trackEvent(event: {
  event_type: string; page_path: string; referrer?: string
  session_id?: string; metadata?: Record<string, unknown>
}): Promise<void> {
  // Fire-and-forget via service client (analytics insert is public, but
  // we use service role to bypass auth entirely for performance)
  const supabase = createServiceClient()
  await supabase.from('analytics_events').insert({
    event_type: event.event_type,
    page_path: event.page_path,
    referrer: event.referrer ?? null,
    session_id: event.session_id ?? null,
    metadata: (event.metadata ?? {}) as any,
  })
}

export async function adminGetAnalyticsSummary(): Promise<{
  totalViews: number; uniqueSessions: number
  topPages: Array<{ page_path: string; event_count: number }>
  viewsByDay: Array<{ day: string; event_count: number }>
}> {
  const supabase = await createClient()

  const [viewsRes, topRes, dailyRes] = await Promise.all([
    supabase.from('analytics_daily_summary').select('event_count.sum()').eq('event_type', 'page_view'),
    supabase.from('analytics_daily_summary').select('page_path, event_count')
      .eq('event_type', 'page_view').order('event_count', { ascending: false }).limit(10),
    supabase.from('analytics_daily_summary').select('day, event_count')
      .eq('event_type', 'page_view').order('day', { ascending: false }).limit(30),
  ])

  return {
    totalViews: (viewsRes.data as any)?.[0]?.['event_count_sum'] ?? 0,
    uniqueSessions: 0, // computed separately if needed
    topPages: topRes.data ?? [],
    viewsByDay: (dailyRes.data ?? []).map(r => ({ day: r.day as string, event_count: r.event_count as number })),
  }
}
