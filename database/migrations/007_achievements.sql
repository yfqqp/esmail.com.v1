-- ============================================================================
-- Migration 007: Certificates, Scholarships & Competitions
-- ============================================================================
-- Modeled as a single table with a `kind` discriminator rather than three
-- separate tables, because they share every field (title, issuer, date,
-- evidence file, description) and are always displayed together in the
-- Academic Journey section's "Achievements" list. A discriminator column
-- keeps querying ("show only competitions") trivial via a WHERE clause
-- while avoiding three near-identical tables to migrate in lockstep.
-- ============================================================================

create type achievement_kind as enum ('certificate', 'scholarship', 'competition', 'award');

create table public.achievements (
  id              uuid primary key default gen_random_uuid(),
  kind            achievement_kind not null,

  title           text not null,
  issuer          text,                     -- "Ministry of Education", "Saudi Robotics Federation"
  description     text,

  evidence_media_id uuid references public.media_items(id) on delete set null,  -- scanned cert / certificate PDF
  external_url    text,                     -- verification link if the issuer provides one

  awarded_on      date,
  expires_on      date,                     -- relevant for time-bound certifications

  rank_or_result  text,                     -- "Regional Finalist", "1st Place", "95/100" — free text, kind-dependent

  tags            text[] not null default '{}',
  is_featured     boolean not null default false,
  sort_order      integer not null default 0,
  content_status  content_status not null default 'published',

  translations    jsonb not null default '{}'::jsonb,

  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.achievements is
  'Unified table for certificates, scholarships, competition results, and awards. The `kind` column discriminates type for filtered display. Built to scale to hundreds of rows.';

create index idx_achievements_kind on public.achievements(kind);
create index idx_achievements_status on public.achievements(content_status);
create index idx_achievements_featured on public.achievements(is_featured) where is_featured = true;
create index idx_achievements_sort on public.achievements(sort_order);
create index idx_achievements_awarded_on on public.achievements(awarded_on desc);

create trigger trg_achievements_updated_at
  before update on public.achievements
  for each row execute function set_updated_at();

insert into public.achievements (kind, title, issuer, rank_or_result, awarded_on, is_featured, sort_order) values
('certificate', 'High School Excellence Certificate', 'Ministry of Education', '98.7% GPA Equivalent', '2024-06-01', true, 0),
('competition', 'Robotics Competition', 'Saudi Robotics Federation', 'Regional Finalist', '2023-11-15', true, 1),
('certificate', 'Qudurat Aptitude Exam', 'National Center for Assessment', '95 / 100', '2024-03-10', true, 2);
