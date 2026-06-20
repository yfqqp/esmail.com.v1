-- ============================================================================
-- Migration 010: Theme, Navigation, SEO, Site Settings, Analytics
-- ============================================================================

-- ── Theme Settings ────────────────────────────────────────────────────────────
create table public.theme_settings (
  id           uuid primary key default gen_random_uuid(),
  name         text not null default 'Default',
  is_active    boolean not null default false,
  colors       jsonb not null default '{
    "accent":       "#4F6EF7",
    "accent_dim":   "#3A54C4",
    "amber":        "#F0A500",
    "background":   "#04060F",
    "surface":      "#0D1220",
    "card":         "#111827",
    "text_primary": "#EDF2FF",
    "text_muted":   "#7A869A",
    "border":       "#1A2540"
  }'::jsonb,
  typography   jsonb not null default '{
    "font_display": "Syne",
    "font_body":    "Inter",
    "font_mono":    "JetBrains Mono",
    "base_size":    "16px",
    "scale_ratio":  1.25
  }'::jsonb,
  spacing      jsonb not null default '{
    "section_padding_y": "120px",
    "section_padding_x": "clamp(1.5rem, 5vw, 3.5rem)",
    "card_radius":       "16px",
    "border_radius":     "10px"
  }'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index idx_theme_single_active on public.theme_settings(is_active) where is_active = true;
create trigger trg_theme_updated_at before update on public.theme_settings
  for each row execute function set_updated_at();

insert into public.theme_settings (name, is_active) values ('Default Dark', true);

-- ── Navigation Items ──────────────────────────────────────────────────────────
create type nav_item_type as enum ('section_anchor', 'internal_page', 'external_url');

create table public.navigation_items (
  id             uuid primary key default gen_random_uuid(),
  label          text not null,
  item_type      nav_item_type not null default 'section_anchor',
  target         text not null,        -- section slug, /path, or https://url
  is_visible     boolean not null default true,
  sort_order     integer not null default 0,
  open_new_tab   boolean not null default false,
  parent_id      uuid references public.navigation_items(id) on delete set null,  -- for dropdown groups
  translations   jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_nav_sort    on public.navigation_items(sort_order);
create index idx_nav_visible on public.navigation_items(is_visible) where is_visible = true;
create trigger trg_nav_updated_at before update on public.navigation_items
  for each row execute function set_updated_at();

insert into public.navigation_items (label, item_type, target, sort_order) values
('Story',     'section_anchor', 'story',        0),
('Academic',  'section_anchor', 'academic',     1),
('Projects',  'section_anchor', 'projects',     2),
('Thoughts',  'section_anchor', 'thoughts',     3),
('Interests', 'section_anchor', 'interests',    4),
('Vision',    'section_anchor', 'vision',       5),
('Quotes',    'section_anchor', 'quotes',       6),
('AI',        'section_anchor', 'ai-assistant', 7);

-- ── SEO Settings ──────────────────────────────────────────────────────────────
create table public.seo_settings (
  id               uuid primary key default gen_random_uuid(),
  page_key         text not null unique,    -- 'home', 'projects', 'blog', 'project_detail', etc.
  title            text not null,
  description      text,
  og_title         text,
  og_description   text,
  og_image_url     text,
  twitter_card     text not null default 'summary_large_image',
  structured_data  jsonb,                   -- JSON-LD for rich results
  canonical_url    text,
  no_index         boolean not null default false,
  translations     jsonb not null default '{}'::jsonb,
  updated_at       timestamptz not null default now()
);

create trigger trg_seo_updated_at before update on public.seo_settings
  for each row execute function set_updated_at();

insert into public.seo_settings (page_key, title, description) values
('home',           'Ismail Safwan — Robotics & AI Engineer',                     'Engineering the future through robotics, AI, and mechatronics. Personal platform of Ismail Safwan.'),
('projects',       'Projects — Ismail Safwan',                                   'Technical and engineering projects by Ismail Safwan.'),
('blog',           'Thoughts — Ismail Safwan',                                   'Reflections, lessons, and ideas from Ismail Safwan.'),
('gallery',        'Gallery — Ismail Safwan',                                    'Memories, events, and milestones.'),
('project_detail', '{title} — Ismail Safwan',                                    ''),
('blog_detail',    '{title} — Ismail Safwan',                                    '');

-- ── Site Settings (key-value store) ──────────────────────────────────────────
-- General-purpose settings bucket for things that don't justify their own
-- table: feature flags, contact info, social links, Google Analytics ID, etc.
create table public.site_settings (
  key          text primary key,
  value        jsonb not null,
  label        text,                      -- human-readable label for the admin UI
  description  text,
  group_key    text not null default 'general',
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles(id) on delete set null
);

create index idx_site_settings_group on public.site_settings(group_key);
create trigger trg_site_settings_updated_at before update on public.site_settings
  for each row execute function set_updated_at();

insert into public.site_settings (key, value, label, group_key) values
('site_name',           '"Ismail Safwan"',                  'Site Name',             'general'),
('site_tagline',        '"Engineering the future."',        'Tagline',               'general'),
('site_url',            '"https://ismailsafwan.com"',       'Production URL',        'general'),
('default_language',    '"en"',                             'Default Language',      'general'),
('contact_email',       '"hello@ismailsafwan.com"',         'Contact Email',         'contact'),
('github_url',          '""',                               'GitHub URL',            'social'),
('linkedin_url',        '""',                               'LinkedIn URL',          'social'),
('twitter_url',         '""',                               'X / Twitter URL',       'social'),
('ga_measurement_id',   '""',                               'Google Analytics ID',   'analytics'),
('ai_enabled',          'false',                            'AI Chat Enabled',       'features'),
('blog_enabled',        'true',                             'Blog Section Enabled',  'features'),
('maintenance_mode',    'false',                            'Maintenance Mode',      'features');

-- ── Analytics Events ──────────────────────────────────────────────────────────
-- Lightweight first-party analytics that never sends data to a third party.
-- Designed to keep 6 months of raw events then roll up via scheduled function.
create table public.analytics_events (
  id           uuid primary key default gen_random_uuid(),
  event_type   text not null,              -- 'page_view', 'section_view', 'project_click', etc.
  page_path    text not null,
  referrer     text,
  user_agent   text,
  country_code text,
  session_id   text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- Partition-friendly indexes; add range partitioning by month if volume warrants it.
create index idx_analytics_event_type  on public.analytics_events(event_type);
create index idx_analytics_page        on public.analytics_events(page_path);
create index idx_analytics_created_at  on public.analytics_events(created_at desc);
create index idx_analytics_session     on public.analytics_events(session_id);

-- Materialized daily summary view — refreshed nightly by a cron/pg_cron job.
create materialized view public.analytics_daily_summary as
select
  date_trunc('day', created_at) as day,
  page_path,
  event_type,
  count(*) as event_count,
  count(distinct session_id) as unique_sessions
from public.analytics_events
group by 1, 2, 3
with data;

create index idx_analytics_summary_day  on public.analytics_daily_summary(day desc);
create index idx_analytics_summary_path on public.analytics_daily_summary(page_path);
