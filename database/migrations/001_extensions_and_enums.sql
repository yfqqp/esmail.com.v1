-- ============================================================================
-- Migration 001: Extensions, Enums, and Shared Helper Functions
-- ============================================================================
-- This migration establishes the foundational primitives used across every
-- other table in the schema: UUID generation, full-text search, enumerated
-- types for status/role fields, and the updated_at trigger function that
-- every content table reuses.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";        -- fuzzy / partial text search (media library, search bar)
create extension if not exists "unaccent";        -- accent-insensitive search, useful for Arabic/Russian transliteration

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

-- Roles are intentionally minimal at launch (single admin) but designed to
-- grow into a team (e.g. editor, contributor) without a schema change.
create type app_role as enum ('owner', 'admin', 'editor', 'viewer');

-- Generic publish lifecycle reused by projects, blog posts, certificates, etc.
create type content_status as enum ('draft', 'published', 'archived');

-- Project-specific status (distinct from content_status because "Active" /
-- "Planned" describes real-world progress, not CMS publish state).
create type project_status as enum ('planned', 'active', 'completed', 'on_hold', 'archived');

-- Section block types. New types can be appended without breaking existing
-- rows because section_type is referenced, never assumed, throughout the
-- rendering engine (see services/block-registry).
create type section_type as enum (
  'hero',
  'timeline',
  'academic',
  'projects',
  'journal',
  'interests',
  'vision',
  'quotes',
  'gallery',
  'blog_list',
  'ai_assistant',
  'custom_html',
  'custom_rich_text'
);

create type media_kind as enum ('image', 'video', 'document', 'audio', 'other');

create type language_code as enum ('en', 'ar', 'ru');

create type ai_source_type as enum ('manual_note', 'uploaded_document', 'site_content_sync', 'url_import');

create type ai_processing_status as enum ('pending', 'processing', 'embedded', 'failed');

-- ----------------------------------------------------------------------------
-- Shared trigger: keep updated_at accurate on every mutable table
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function set_updated_at() is
  'Generic trigger function: sets updated_at = now() on any UPDATE. Attached per-table in later migrations.';

-- ----------------------------------------------------------------------------
-- Shared trigger: auto-generate a URL-safe slug from a title column if the
-- caller did not supply one. Used by projects, blog_posts, certificates.
-- ----------------------------------------------------------------------------
create or replace function slugify(input text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      regexp_replace(lower(unaccent(input)), '[^a-z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-'
  );
$$;

comment on function slugify(text) is
  'Pure function: converts arbitrary text into a lowercase, hyphenated, accent-stripped slug.';
