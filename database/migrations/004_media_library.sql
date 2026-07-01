-- ============================================================================
-- Migration 004: Media Library
-- ============================================================================
-- Centralized registry of every uploaded asset (image, video, PDF, document).
-- Actual binary storage lives in Cloudinary; this table is the searchable,
-- taggable, relational index that the rest of the app references via
-- media_id foreign keys instead of duplicating raw URLs everywhere.
-- ============================================================================

create table public.media_items (
  id                    uuid primary key default gen_random_uuid(),
  kind                  media_kind not null,
  title                 text not null,
  alt_text              text,                 -- accessibility: enforced at the app layer for images
  description           text,

  -- Cloudinary identifiers — public_id is what we use to transform/delete;
  -- secure_url is the ready-to-render CDN link.
  cloudinary_public_id  text not null unique,
  secure_url            text not null,
  format                text,                 -- "jpg", "mp4", "pdf"
  bytes                 bigint,
  width                 integer,
  height                integer,
  duration_seconds      numeric,              -- populated for video/audio

  tags                  text[] not null default '{}',
  folder                text not null default 'general',   -- logical grouping shown in the Media Library UI

  uploaded_by           uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.media_items is
  'Index of every Cloudinary asset. The app never stores raw Cloudinary URLs elsewhere — it references media_items.id.';

create index idx_media_kind on public.media_items(kind);
create index idx_media_folder on public.media_items(folder);
create index idx_media_tags on public.media_items using gin(tags);
create index idx_media_search on public.media_items using gin (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(alt_text,''))
);
create index idx_media_created_at on public.media_items(created_at desc);

create trigger trg_media_items_updated_at
  before update on public.media_items
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- A reusable view that filters out soft-deleted-equivalent rows (none yet —
-- placeholder kept intentionally simple). Future: add `deleted_at` here if
-- soft-delete is desired instead of hard delete; the column is omitted for
-- now to keep cleanup simple, since Cloudinary is the actual source of file
-- truth and this row simply mirrors it.
-- ============================================================================
