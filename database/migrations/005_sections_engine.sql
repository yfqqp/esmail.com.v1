-- ============================================================================
-- Migration 005: Dynamic Sections Engine
-- ============================================================================
-- This is the heart of the platform. The public homepage NEVER hardcodes
-- section order, visibility, or even which section types exist on the page.
-- Everything renders from this table, ordered by `sort_order`, filtered by
-- `is_visible`. A section's shape is entirely described by `section_type`
-- (which React/Next.js block component to mount) plus its `content` JSONB
-- (the data that component receives as props).
--
-- Why JSONB for content instead of one table per section type:
--   - Section types will grow over the platform's 10-year lifespan. A rigid
--     relational schema per type means a migration every time a new block
--     is invented. JSONB lets new block types ship as a frontend PR only.
--   - Each block component owns and validates its own content shape via a
--     Zod schema in the Next.js app (see src/lib/validation/sections.ts).
--     The database stays a flexible, fast, indexable store; validation
--     lives at the application boundary where it belongs.
--   - Structured sub-entities that benefit from real relations and queries
--     (projects, certificates, timeline events, blog posts, quotes) are
--     NOT stuffed into this JSONB — they get first-class tables (next
--     migrations) and a section simply *references* them by type, e.g. a
--     section with type='projects' renders live from the `projects` table
--     filtered by status='published', not from a frozen JSON snapshot.
-- ============================================================================

create table public.sections (
  id              uuid primary key default gen_random_uuid(),

  -- Stable machine identifier, never shown to the user, used as the DOM id
  -- for in-page anchor navigation (e.g. "#projects"). Set once at creation.
  slug            text not null unique,

  section_type    section_type not null,

  -- Human-facing label, editable any time from the admin Section Manager.
  -- This is what changes when the user "renames" a section.
  label           text not null,

  is_visible      boolean not null default true,
  sort_order      integer not null default 0,

  -- Free-form content for block types that don't have a dedicated table
  -- (hero, journal/quotes copy, interests, vision, ai_assistant config,
  -- custom_html, custom_rich_text). For block types backed by their own
  -- table (projects, timeline, gallery, blog_list), this holds only
  -- presentation-level overrides (heading text, subheading, items-per-page)
  -- — never a duplicate copy of the underlying rows.
  content         jsonb not null default '{}'::jsonb,

  -- Per-locale overrides for label/heading/subheading text. Shape:
  -- { "ar": { "label": "...", "heading": "..." }, "ru": { ... } }
  translations    jsonb not null default '{}'::jsonb,

  -- Optional per-section layout/style overrides (e.g. background variant,
  -- max-width, spacing density) so the theme system can offer per-section
  -- knobs without a schema change.
  layout_config   jsonb not null default '{}'::jsonb,

  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.sections is
  'The dynamic block registry. The public site renders sections in sort_order, skipping any with is_visible = false. This table is the single source of truth for homepage composition.';
comment on column public.sections.content is
  'Block-specific data. Shape varies per section_type and is validated by a matching Zod schema in the application layer (see lib/validation/sections.ts), not enforced in Postgres, to keep new block types deployable without a migration.';

create index idx_sections_sort_order on public.sections(sort_order);
create index idx_sections_visible on public.sections(is_visible);
create index idx_sections_type on public.sections(section_type);
create unique index idx_sections_unique_sort on public.sections(sort_order) where is_visible = true;

create trigger trg_sections_updated_at
  before update on public.sections
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Reordering helper: atomically resequences sort_order for a list of section
-- ids in the order provided. Called by the admin drag-and-drop endpoint so
-- the whole reorder happens in one transaction instead of N separate updates
-- racing each other.
-- ----------------------------------------------------------------------------
create or replace function public.reorder_sections(section_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i integer := 0;
  sid uuid;
begin
  if not public.is_editor_or_above() then
    raise exception 'Insufficient permissions to reorder sections';
  end if;

  -- Temporarily relax the unique sort_order constraint within this
  -- transaction by deferring would require the constraint to be DEFERRABLE;
  -- instead we shift everything into a safe high range first, then assign
  -- final values, avoiding any collision window.
  update public.sections set sort_order = sort_order + 100000;

  foreach sid in array section_ids loop
    update public.sections set sort_order = i where id = sid;
    i := i + 1;
  end loop;
end;
$$;

comment on function public.reorder_sections(uuid[]) is
  'Atomically reassigns sort_order for all given section IDs based on array position. Used by the admin drag-and-drop reorder action.';

-- ----------------------------------------------------------------------------
-- Seed: the nine default sections matching the platform's launch content,
-- in their initial order. Admins can rename, hide, reorder, or delete any
-- of these from day one — nothing here is special-cased in application code.
-- ----------------------------------------------------------------------------
insert into public.sections (slug, section_type, label, sort_order, content) values
(
  'hero', 'hero', 'Hero', 0,
  '{
    "name": "Ismail Safwan",
    "role": "Robotics & AI Engineer",
    "intro": "I build at the intersection of robotics, AI, and human ambition — driven by the belief that the most meaningful systems are those that think, adapt, and endure.",
    "badge": "Currently building the future",
    "cta1Text": "My Story", "cta1Link": "story",
    "cta2Text": "Talk to my AI", "cta2Link": "ai-assistant",
    "stats": [
      {"label": "GPA Equivalent", "value": "98.7%"},
      {"label": "Qudurat Score", "value": "95/100"},
      {"label": "Languages", "value": "3+"}
    ]
  }'::jsonb
),
(
  'story', 'timeline', 'My Story', 1,
  '{
    "heading": "The journey behind the numbers",
    "subheading": "Achievements do not exist in isolation. Every result is the visible surface of invisible work."
  }'::jsonb
),
(
  'academic', 'academic', 'Academic Journey', 2,
  '{
    "heading": "Built on rigor and vision",
    "stats": [
      {"icon": "🎓", "label": "GPA Equivalent", "value": "98.7%"},
      {"icon": "📊", "label": "Qudurat Score", "value": "95/100"},
      {"icon": "🌐", "label": "Languages", "value": "3+"},
      {"icon": "⚙️", "label": "Fields", "value": "5+"}
    ],
    "researchTags": ["Autonomous Systems","Computer Vision","Control Theory","Machine Learning","Embedded Systems"]
  }'::jsonb
),
(
  'projects', 'projects', 'Projects', 3,
  '{"heading": "Things I am building", "itemsPerPage": 12}'::jsonb
),
(
  'thoughts', 'journal', 'Personal Thoughts', 4,
  '{
    "heading": "How I think",
    "principles": [
      "Excellence is not achieved in moments — it is built in habits.",
      "Understand systems deeply before proposing improvements.",
      "Comfort is the enemy of growth; discomfort is tuition.",
      "Long-term thinking is the ultimate competitive advantage.",
      "Build things that can outlast you."
    ]
  }'::jsonb
),
(
  'interests', 'interests', 'Hobbies & Interests', 5,
  '{
    "heading": "What I am drawn to",
    "items": [
      {"icon": "🤖", "name": "Robotics & Mechatronics", "desc": "The synthesis of mechanical, electrical, and computational systems into intelligent machines."},
      {"icon": "🧠", "name": "Artificial Intelligence", "desc": "Machine learning architectures and the philosophy of machine cognition."},
      {"icon": "🌐", "name": "Languages", "desc": "Arabic, English, and ongoing exploration of others."},
      {"icon": "⚙️", "name": "Engineering Design", "desc": "From CAD to code — the full stack of bringing physical systems to life."},
      {"icon": "📚", "name": "Learning Systems", "desc": "Meta-learning, spaced repetition, and knowledge graphs."},
      {"icon": "🚀", "name": "Future Technology", "desc": "AGI trajectories, space technology, and human-machine integration."}
    ]
  }'::jsonb
),
(
  'vision', 'vision', 'Vision', 6,
  '{
    "heading": "Where I am going",
    "universities": ["MIT", "ETH Zurich", "Stanford", "TU Munich", "Imperial College London"],
    "career": "Lead research in autonomous systems and AI-driven robotics at the intersection of academic excellence and real-world engineering impact.",
    "impact": "Build systems and institutions that empower the next generation of engineers from underrepresented regions."
  }'::jsonb
),
(
  'quotes', 'quotes', 'Quotes & Principles', 7,
  '{"heading": "What I believe"}'::jsonb
),
(
  'ai-assistant', 'ai_assistant', 'AI Assistant', 8,
  '{
    "heading": "Ask anything",
    "subheading": "Powered by Claude AI and trained on Ismail real story, goals, and thinking.",
    "suggestions": ["Who is Ismail?", "What are his goals?", "How does he think about learning?", "What projects is he building?"]
  }'::jsonb
);
