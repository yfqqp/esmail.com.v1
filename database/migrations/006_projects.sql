-- ============================================================================
-- Migration 006: Projects
-- ============================================================================
-- First-class table (not JSONB-in-sections) because projects need real
-- queries: filter by status/category, sort by date, paginate hundreds of
-- rows, and link to a dedicated detail page at /projects/[slug]. The
-- "projects" section in `sections` simply renders the latest N published
-- rows from this table — it never stores project data itself.
-- ============================================================================

create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,

  title           text not null,
  summary         text,                      -- short card-view description
  body            text,                      -- full rich-text/markdown content for the detail page
  cover_media_id  uuid references public.media_items(id) on delete set null,
  gallery_media_ids uuid[] not null default '{}',

  category        text not null default 'General',
  tags            text[] not null default '{}',
  tech_stack      text[] not null default '{}',

  status          project_status not null default 'planned',
  content_status  content_status not null default 'draft',

  repo_url        text,
  demo_url        text,
  case_study_url  text,

  started_on      date,
  completed_on    date,

  is_featured     boolean not null default false,
  sort_order      integer not null default 0,

  translations    jsonb not null default '{}'::jsonb,  -- { "ar": {"title":..,"summary":..,"body":..}, "ru": {...} }
  seo_title       text,
  seo_description text,

  view_count      bigint not null default 0,

  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.projects is
  'Technical/engineering projects shown in the Projects section and individual /projects/[slug] pages. Designed to scale to hundreds of rows.';

create index idx_projects_status on public.projects(content_status, status);
create index idx_projects_category on public.projects(category);
create index idx_projects_tags on public.projects using gin(tags);
create index idx_projects_tech on public.projects using gin(tech_stack);
create index idx_projects_featured on public.projects(is_featured) where is_featured = true;
create index idx_projects_sort on public.projects(sort_order);
create index idx_projects_search on public.projects using gin (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(body,''))
);

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function set_updated_at();

create or replace function public.projects_auto_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := slugify(new.title) || '-' || substr(new.id::text, 1, 8);
  end if;
  return new;
end;
$$;

create trigger trg_projects_auto_slug
  before insert on public.projects
  for each row execute function public.projects_auto_slug();

-- Seed data matching the previously approved content set.
insert into public.projects (title, summary, body, category, tags, tech_stack, status, content_status, is_featured, sort_order) values
(
  'Autonomous Navigation System',
  'Sensor-fusion-based autonomous vehicle navigation stack using ROS2, LIDAR, and computer vision.',
  'A from-scratch navigation stack combining LIDAR point-cloud processing, visual odometry, and a particle-filter localization layer running on ROS2. Designed to operate in unstructured outdoor terrain with partial GPS denial.',
  'Robotics', array['robotics','autonomy','navigation'], array['ROS2','Python','OpenCV','LIDAR'],
  'active', 'published', true, 0
),
(
  'AI Academic Assistant',
  'Personal AI tool that processes academic papers, generates summaries, and creates structured study paths.',
  'A retrieval-augmented assistant that ingests PDFs and lecture notes, builds a personal knowledge graph, and generates spaced-repetition study schedules tailored to exam timelines.',
  'AI / NLP', array['ai','productivity'], array['LLMs','RAG','Python','Vector DB'],
  'active', 'published', true, 1
),
(
  'Mechatronic Arm Controller',
  '6-DOF robotic arm with real-time inverse kinematics solver, built from mechanical design through embedded firmware.',
  'Complete mechatronic system: SolidWorks mechanical design, custom PCB motor drivers, and a real-time inverse-kinematics solver running on an STM32, achieving sub-millimeter repeatability.',
  'Mechatronics', array['robotics','embedded'], array['C++','STM32','SolidWorks','Kinematics'],
  'completed', 'published', false, 2
),
(
  'Multilingual Learning Platform',
  'Adaptive language learning system using spaced repetition and contextual AI immersion.',
  'A Next.js and Supabase platform that adapts vocabulary exposure to the learner forgetting curve, with AI-generated contextual example sentences per word.',
  'Software', array['education','ai'], array['Next.js','TypeScript','Supabase','AI'],
  'planned', 'published', false, 3
);
