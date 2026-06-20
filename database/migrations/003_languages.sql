-- ============================================================================
-- Migration 003: Languages
-- ============================================================================
-- Languages are data, not code. Adding Spanish next year should mean an
-- admin-panel form submission, never a deploy. The `languages` table is the
-- source of truth for which locales exist; `language_code` enum constrains
-- it to a known set for type-safety at the DB level while the table itself
-- carries display metadata (native name, flag, RTL flag, active state).
--
-- NOTE: language_code enum currently has ('en','ar','ru'). Extending past
-- these three requires a one-line `alter type language_code add value`
-- migration — trivial, forward-compatible, and explicitly anticipated by
-- the platform brief ("allow future language expansion").
-- ============================================================================

create table public.languages (
  code          language_code primary key,
  name_en       text not null,           -- "Arabic" — for admin UI labels
  native_name   text not null,           -- "العربية" — shown in the language switcher
  is_rtl        boolean not null default false,
  is_active     boolean not null default true,
  is_default    boolean not null default false,
  flag_emoji    text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.languages is
  'Registry of supported locales. Drives the language switcher and which translation columns are required.';

create unique index idx_languages_single_default
  on public.languages (is_default)
  where is_default = true;

create trigger trg_languages_updated_at
  before update on public.languages
  for each row execute function set_updated_at();

insert into public.languages (code, name_en, native_name, is_rtl, is_active, is_default, flag_emoji, sort_order) values
  ('en', 'English', 'English', false, true, true,  '🇬🇧', 0),
  ('ar', 'Arabic',  'العربية', true,  true, false, '🇸🇦', 1),
  ('ru', 'Russian', 'Русский', false, true, false, '🇷🇺', 2);

-- ----------------------------------------------------------------------------
-- Translation strategy
-- ----------------------------------------------------------------------------
-- Rather than a separate `*_translations` table per content type (which
-- multiplies migrations and joins), every translatable table stores a
-- `translations jsonb` column shaped as:
--   { "en": { "title": "...", "body": "..." }, "ar": { ... }, "ru": { ... } }
-- The base columns (title, body, etc.) always hold the default-language
-- content so non-i18n-aware queries and the AI knowledge layer keep working
-- unmodified. A GIN index on `translations` keeps language-filtered queries
-- fast. This pattern is applied to: sections, projects, certificates,
-- timeline_events, blog_posts, quotes, navigation_items, site_settings.
--
-- Rationale: with only 3-6 languages and content volumes in the hundreds
-- (not millions), JSONB avoids N additional join tables while remaining
-- fully indexable and queryable via Postgres's native JSON operators.
-- ============================================================================
