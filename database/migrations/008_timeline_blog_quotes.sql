-- ============================================================================
-- Migration 008: Timeline Events, Blog Posts, Quotes
-- ============================================================================

-- ── Timeline Events ───────────────────────────────────────────────────────────
create table public.timeline_events (
  id              uuid primary key default gen_random_uuid(),
  year            text not null,
  title           text not null,
  body            text,
  category        text not null default 'life',       -- life, academic, project, travel, future
  icon            text,                               -- emoji
  cover_media_id  uuid references public.media_items(id) on delete set null,
  is_milestone    boolean not null default false,
  is_future       boolean not null default false,     -- shown with a different style (planned future event)
  sort_order      integer not null default 0,
  content_status  content_status not null default 'published',
  translations    jsonb not null default '{}'::jsonb,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_timeline_category    on public.timeline_events(category);
create index idx_timeline_milestone   on public.timeline_events(is_milestone) where is_milestone = true;
create index idx_timeline_sort        on public.timeline_events(sort_order);

create trigger trg_timeline_updated_at
  before update on public.timeline_events
  for each row execute function set_updated_at();

insert into public.timeline_events (year, title, body, category, is_milestone, is_future, sort_order) values
('2006',   'Origin',           'Born with a curiosity that would define everything. From early on, I was drawn to how things work — not just what they do.', 'life',     true,  false, 0),
('2018',   'The First Build',  'First encounter with robotics. The moment a machine I built moved for the first time, I understood this was not a hobby — it was a calling.', 'project', true, false, 1),
('2022',   'Academic Ascent',  'Committed fully to academic excellence. Every exam, every project, every late night was a deliberate investment into a future I could see clearly.', 'academic', false, false, 2),
('2024',   'The 98.7%',        'Graduated high school with a GPA equivalent of 98.7%. Not a number I chase for pride — proof that discipline compounds.', 'academic', true, false, 3),
('2024',   'Qudurat: 95',      'Scored 95 on the Qudurat exam. Quantitative reasoning meets strategic thinking — a benchmark I set and met.', 'academic', true, false, 4),
('2025',   'Building Forward', 'Currently designing my international academic path. The world is the campus I intend to graduate from.', 'life', false, false, 5),
('Future', 'The Vision',       'Contribute to global robotics and AI research. Build systems that outlast me.', 'future', true, true, 6);

-- ── Blog Posts ────────────────────────────────────────────────────────────────
create table public.blog_posts (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  title                text not null,
  excerpt              text,
  content              text,                           -- Markdown / ProseMirror JSON stored as text
  cover_media_id       uuid references public.media_items(id) on delete set null,
  category             text not null default 'thoughts',
  tags                 text[] not null default '{}',
  content_status       content_status not null default 'draft',
  is_featured          boolean not null default false,
  reading_time_minutes integer,
  published_at         timestamptz,
  sort_order           integer not null default 0,
  view_count           bigint not null default 0,
  translations         jsonb not null default '{}'::jsonb,
  seo_title            text,
  seo_description      text,
  seo_og_image         text,
  author_id            uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_blog_status       on public.blog_posts(content_status);
create index idx_blog_published_at on public.blog_posts(published_at desc) where content_status = 'published';
create index idx_blog_tags         on public.blog_posts using gin(tags);
create index idx_blog_search       on public.blog_posts using gin (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,''))
);

create trigger trg_blog_updated_at
  before update on public.blog_posts
  for each row execute function set_updated_at();

create or replace function public.blog_auto_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := slugify(new.title) || '-' || substr(new.id::text,1,8);
  end if;
  return new;
end;
$$;
create trigger trg_blog_auto_slug before insert on public.blog_posts
  for each row execute function public.blog_auto_slug();

insert into public.blog_posts (title, excerpt, category, content_status, is_featured, sort_order) values
('On Discipline vs Motivation',     'Motivation is a wave. You can''t surf waves forever — you need a boat. Discipline is the boat.',                                      'reflections', 'published', true,  0),
('Why I Study What I Don''t Know',  'The mind expands only when it encounters genuine resistance. I deliberately seek the subjects that intimidate me most.',               'learning',    'published', false, 1),
('INTJ and the Long Game',          'Every decision I make today is a chess move for a future I''ve already mapped. Short-term discomfort is irrelevant data.',            'mindset',     'published', false, 2),
('Languages as Operating Systems',  'Each language you speak is a different OS for your mind. You don''t just translate — you think differently.',                         'languages',   'published', false, 3);

-- ── Quotes ────────────────────────────────────────────────────────────────────
create table public.quotes (
  id             uuid primary key default gen_random_uuid(),
  text           text not null,
  author         text not null default 'Ismail Safwan',
  source         text,
  category       text not null default 'general',
  is_personal    boolean not null default false,   -- true = Ismail's own words
  is_featured    boolean not null default false,
  sort_order     integer not null default 0,
  content_status content_status not null default 'published',
  translations   jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_quotes_category   on public.quotes(category);
create index idx_quotes_featured   on public.quotes(is_featured) where is_featured = true;
create index idx_quotes_sort       on public.quotes(sort_order);

create trigger trg_quotes_updated_at
  before update on public.quotes
  for each row execute function set_updated_at();

insert into public.quotes (text, author, is_personal, is_featured, sort_order) values
('The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius', false, true, 0),
('A person who never made a mistake never tried anything new.',                        'Albert Einstein', false, true, 1),
('The measure of intelligence is the ability to change.',                              'Albert Einstein', false, false, 2),
('Your most important work is always ahead of you, never behind you.',                 'Stephen Covey',   false, false, 3);
