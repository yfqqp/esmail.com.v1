// ============================================================================
// src/types/database.ts — TypeScript mirror of the PostgreSQL schema
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type AppRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type ContentStatus = 'draft' | 'published' | 'archived'
export type ProjectStatus = 'planned' | 'active' | 'completed' | 'on_hold' | 'archived'
export type MediaKind = 'image' | 'video' | 'document' | 'audio' | 'other'
export type LanguageCode = 'en' | 'ar' | 'ru'
export type SectionType =
  | 'hero' | 'timeline' | 'academic' | 'projects' | 'journal'
  | 'interests' | 'vision' | 'quotes' | 'gallery' | 'blog_list'
  | 'ai_assistant' | 'custom_html' | 'custom_rich_text'
export type AchievementKind = 'certificate' | 'scholarship' | 'competition' | 'award'
export type AISourceType = 'manual_note' | 'uploaded_document' | 'site_content_sync' | 'url_import'
export type AIProcessingStatus = 'pending' | 'processing' | 'embedded' | 'failed'
export type NavItemType = 'section_anchor' | 'internal_page' | 'external_url'

export interface Profile {
  id: string; email: string; display_name: string | null; avatar_url: string | null
  role: AppRole; is_active: boolean; last_login_at: string | null
  created_at: string; updated_at: string
}

export interface Language {
  code: LanguageCode; name_en: string; native_name: string; is_rtl: boolean
  is_active: boolean; is_default: boolean; flag_emoji: string | null
  sort_order: number; created_at: string; updated_at: string
}

export interface MediaItem {
  id: string; kind: MediaKind; title: string; alt_text: string | null
  description: string | null; cloudinary_public_id: string; secure_url: string
  format: string | null; bytes: number | null; width: number | null; height: number | null
  duration_seconds: number | null; tags: string[]; folder: string
  uploaded_by: string | null; created_at: string; updated_at: string
}

export interface Section {
  id: string; slug: string; section_type: SectionType; label: string
  is_visible: boolean; sort_order: number; content: Json; translations: Json
  layout_config: Json; created_by: string | null; created_at: string; updated_at: string
}

export interface Project {
  id: string; slug: string; title: string; summary: string | null; body: string | null
  cover_media_id: string | null; gallery_media_ids: string[]; category: string
  tags: string[]; tech_stack: string[]; status: ProjectStatus; content_status: ContentStatus
  repo_url: string | null; demo_url: string | null; case_study_url: string | null
  started_on: string | null; completed_on: string | null; is_featured: boolean
  sort_order: number; translations: Json; seo_title: string | null
  seo_description: string | null; view_count: number; created_by: string | null
  created_at: string; updated_at: string
}

export interface Achievement {
  id: string; kind: AchievementKind; title: string; issuer: string | null
  description: string | null; evidence_media_id: string | null; external_url: string | null
  awarded_on: string | null; expires_on: string | null; rank_or_result: string | null
  tags: string[]; is_featured: boolean; sort_order: number; content_status: ContentStatus
  translations: Json; created_by: string | null; created_at: string; updated_at: string
}

export interface TimelineEvent {
  id: string; year: string; title: string; body: string | null; category: string
  icon: string | null; cover_media_id: string | null; is_milestone: boolean; is_future: boolean
  sort_order: number; content_status: ContentStatus; translations: Json
  created_by: string | null; created_at: string; updated_at: string
}

export interface BlogPost {
  id: string; slug: string; title: string; excerpt: string | null; content: string | null
  cover_media_id: string | null; category: string; tags: string[]; content_status: ContentStatus
  is_featured: boolean; reading_time_minutes: number | null; published_at: string | null
  sort_order: number; view_count: number; translations: Json; seo_title: string | null
  seo_description: string | null; seo_og_image: string | null; author_id: string | null
  created_at: string; updated_at: string
}

export interface Quote {
  id: string; text: string; author: string; source: string | null; category: string
  is_personal: boolean; is_featured: boolean; sort_order: number; content_status: ContentStatus
  translations: Json; created_at: string; updated_at: string
}

export interface AIKnowledgeEntry {
  id: string; title: string; source_type: AISourceType; raw_content: string | null
  source_url: string | null; file_media_id: string | null; processing_status: AIProcessingStatus
  chunk_count: number; embedding_model: string | null; token_count: number | null
  tags: string[]; is_active: boolean; notes: string | null; created_by: string | null
  created_at: string; updated_at: string
}

export interface AIKnowledgeChunk {
  id: string; entry_id: string; chunk_index: number; content: string
  embedding_raw: number[] | null; metadata: Json; token_count: number | null; created_at: string
}

export interface ThemeSettings {
  id: string; name: string; is_active: boolean
  colors: { accent: string; accent_dim: string; amber: string; background: string; surface: string; card: string; text_primary: string; text_muted: string; border: string }
  typography: { font_display: string; font_body: string; font_mono: string; base_size: string; scale_ratio: number }
  spacing: { section_padding_y: string; section_padding_x: string; card_radius: string; border_radius: string }
  created_at: string; updated_at: string
}

export interface NavigationItem {
  id: string; label: string; item_type: NavItemType; target: string; is_visible: boolean
  sort_order: number; open_new_tab: boolean; parent_id: string | null; translations: Json
  created_at: string; updated_at: string
}

export interface SEOSettings {
  id: string; page_key: string; title: string; description: string | null
  og_title: string | null; og_description: string | null; og_image_url: string | null
  twitter_card: string; structured_data: Json | null; canonical_url: string | null
  no_index: boolean; translations: Json; updated_at: string
}

export interface SiteSetting {
  key: string; value: Json; label: string | null; description: string | null
  group_key: string; updated_at: string; updated_by: string | null
}

export interface AnalyticsEvent {
  id: string; event_type: string; page_path: string; referrer: string | null
  user_agent: string | null; country_code: string | null; session_id: string | null
  metadata: Json; created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles:             { Row: Profile;           Insert: Omit<Profile,'created_at'|'updated_at'>;             Update: Partial<Profile> }
      languages:            { Row: Language;          Insert: Omit<Language,'created_at'|'updated_at'>;            Update: Partial<Language> }
      media_items:          { Row: MediaItem;         Insert: Omit<MediaItem,'id'|'created_at'|'updated_at'>;      Update: Partial<MediaItem> }
      sections:             { Row: Section;           Insert: Omit<Section,'id'|'created_at'|'updated_at'>;        Update: Partial<Section> }
      projects:             { Row: Project;           Insert: Omit<Project,'id'|'created_at'|'updated_at'>;        Update: Partial<Project> }
      achievements:         { Row: Achievement;       Insert: Omit<Achievement,'id'|'created_at'|'updated_at'>;    Update: Partial<Achievement> }
      timeline_events:      { Row: TimelineEvent;     Insert: Omit<TimelineEvent,'id'|'created_at'|'updated_at'>;  Update: Partial<TimelineEvent> }
      blog_posts:           { Row: BlogPost;          Insert: Omit<BlogPost,'id'|'created_at'|'updated_at'>;       Update: Partial<BlogPost> }
      quotes:               { Row: Quote;             Insert: Omit<Quote,'id'|'created_at'|'updated_at'>;          Update: Partial<Quote> }
      ai_knowledge_entries: { Row: AIKnowledgeEntry;  Insert: Omit<AIKnowledgeEntry,'id'|'created_at'|'updated_at'>; Update: Partial<AIKnowledgeEntry> }
      ai_knowledge_chunks:  { Row: AIKnowledgeChunk;  Insert: Omit<AIKnowledgeChunk,'id'|'created_at'>;            Update: Partial<AIKnowledgeChunk> }
      theme_settings:       { Row: ThemeSettings;     Insert: Omit<ThemeSettings,'id'|'created_at'|'updated_at'>;  Update: Partial<ThemeSettings> }
      navigation_items:     { Row: NavigationItem;    Insert: Omit<NavigationItem,'id'|'created_at'|'updated_at'>; Update: Partial<NavigationItem> }
      seo_settings:         { Row: SEOSettings;       Insert: Omit<SEOSettings,'updated_at'>;                      Update: Partial<SEOSettings> }
      site_settings:        { Row: SiteSetting;       Insert: SiteSetting;                                          Update: Partial<SiteSetting> }
      analytics_events:     { Row: AnalyticsEvent;    Insert: Omit<AnalyticsEvent,'id'|'created_at'>;               Update: never }
    }
    Functions: {
      is_admin_or_above:  { Args: Record<never,never>; Returns: boolean }
      is_editor_or_above: { Args: Record<never,never>; Returns: boolean }
      current_user_role:  { Args: Record<never,never>; Returns: AppRole }
      reorder_sections:   { Args: { section_ids: string[] }; Returns: void }
      slugify:            { Args: { input: string }; Returns: string }
    }
  }
}
