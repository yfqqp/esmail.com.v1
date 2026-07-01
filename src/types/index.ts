// src/types/index.ts — Application-level types
export * from './database'

export interface HeroContent { name: string; role: string; intro: string; badge: string; cta1Text: string; cta1Link: string; cta2Text: string; cta2Link: string; stats: Array<{ label: string; value: string }>; backgroundMediaId?: string }
export interface TimelineContent { heading: string; subheading: string }
export interface AcademicContent { heading: string; stats: Array<{ icon: string; label: string; value: string }>; researchTags: string[] }
export interface ProjectsSectionContent { heading: string; itemsPerPage: number; filterByFeatured?: boolean; filterByCategory?: string }
export interface JournalContent { heading: string; principles: string[]; postsPerPage?: number }
export interface InterestItem { icon: string; name: string; desc: string }
export interface InterestsContent { heading: string; items: InterestItem[] }
export interface VisionContent { heading: string; universities: string[]; career: string; impact: string }
export interface QuotesSectionContent { heading: string; layout?: 'grid' | 'carousel' | 'list' }
export interface GalleryContent { heading: string; mediaIds: string[]; columns?: 2 | 3 | 4 }
export interface AIAssistantContent { heading: string; subheading: string; suggestions: string[]; systemPromptOverride?: string }
export interface CustomHtmlContent { heading?: string; html: string }
export interface CustomRichTextContent { heading?: string; body: string }

export interface ApiSuccess<T = unknown> { success: true; data: T }
export interface ApiError { success: false; error: string; code?: string }
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

export interface AdminBreadcrumb { label: string; href?: string }
export interface PaginatedResult<T> { data: T[]; count: number; page: number; pageSize: number; totalPages: number }
export interface FilterState { search?: string; status?: string; category?: string; page: number; pageSize: number; sortBy?: string; sortDir?: 'asc' | 'desc' }

export interface CloudinaryUploadResult { public_id: string; secure_url: string; format: string; width: number; height: number; bytes: number; resource_type: string; duration?: number }

export interface AnalyticsSummary { totalPageViews: number; uniqueSessions: number; topPages: Array<{ path: string; views: number }>; viewsByDay: Array<{ day: string; count: number }> }

export interface AuthUser { id: string; email: string; profile: import('./database').Profile | null }

export function getTranslated<T extends Record<string, unknown>>(base: T, translations: unknown, locale: string, defaultLocale = 'en'): T {
  if (!translations || typeof translations !== 'object') return base
  const map = translations as Record<string, Partial<T>>
  const localeData = map[locale] ?? map[defaultLocale] ?? {}
  return { ...base, ...localeData }
}
