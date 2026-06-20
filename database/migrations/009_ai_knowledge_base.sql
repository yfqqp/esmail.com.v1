-- ============================================================================
-- Migration 009: AI Knowledge Base (RAG-Ready)
-- ============================================================================
-- The AI assistant is not fully wired at launch, but the entire data layer
-- is production-ready so activation is a single API-key environment variable
-- and a background job run. Two tables:
--   ai_knowledge_entries  — source documents uploaded by the admin
--   ai_knowledge_chunks   — paragraph-level chunks with their vector embeddings
--
-- Vector search requires pgvector. Enable it via Supabase dashboard:
--   Extensions → pgvector → Enable
-- The extension is referenced here but not `create extension`-d because
-- Supabase's managed Postgres already provisions it per-project.
-- ============================================================================

-- pgvector is available in Supabase without explicit creation:
-- create extension if not exists vector;  -- uncomment if running on bare PG

create table public.ai_knowledge_entries (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  source_type          ai_source_type not null,

  -- Raw text content (for manual notes and processed documents).
  -- NULL until a background job extracts text from uploaded PDFs/URLs.
  raw_content          text,
  source_url           text,                           -- for url_import type
  file_media_id        uuid references public.media_items(id) on delete set null,

  processing_status    ai_processing_status not null default 'pending',
  chunk_count          integer not null default 0,
  embedding_model      text,                           -- "text-embedding-3-small"
  token_count          integer,

  tags                 text[] not null default '{}',
  is_active            boolean not null default true,  -- soft-disable without deleting chunks
  notes                text,                           -- admin annotation

  created_by           uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_ai_entries_status  on public.ai_knowledge_entries(processing_status);
create index idx_ai_entries_active  on public.ai_knowledge_entries(is_active) where is_active = true;
create index idx_ai_entries_tags    on public.ai_knowledge_entries using gin(tags);

create trigger trg_ai_entries_updated_at
  before update on public.ai_knowledge_entries
  for each row execute function set_updated_at();

-- Chunk table: one row per paragraph/passage extracted from an entry.
-- The `embedding` column stores the 1536-dim vector from OpenAI's
-- text-embedding-3-small. Change the dimension constant if you switch models.
-- The column type uses the pgvector `vector` type; replace with `float[]` if
-- pgvector is not yet enabled on your project.
create table public.ai_knowledge_chunks (
  id            uuid primary key default gen_random_uuid(),
  entry_id      uuid not null references public.ai_knowledge_entries(id) on delete cascade,
  chunk_index   integer not null,
  content       text not null,

  -- Declare as float[] initially; replace with vector(1536) once pgvector
  -- extension is confirmed active on your Supabase project.
  -- embedding  vector(1536),
  embedding_raw float8[],       -- raw float array, queryable via <-> operator with pgvector cast

  metadata      jsonb not null default '{}'::jsonb,    -- page number, source section, etc.
  token_count   integer,
  created_at    timestamptz not null default now()
);

create index idx_ai_chunks_entry     on public.ai_knowledge_chunks(entry_id);
create index idx_ai_chunks_index     on public.ai_knowledge_chunks(entry_id, chunk_index);

comment on column public.ai_knowledge_chunks.embedding_raw is
  'Float8 array of the embedding vector. Migrate to vector(1536) column type after enabling pgvector. Cosine similarity search via: SELECT * FROM ai_knowledge_chunks ORDER BY embedding_raw::vector <=> $1 LIMIT 5';

-- ── Semantic search helper function ─────────────────────────────────────────
-- Uncomment and adjust once pgvector is active and embedding column is
-- migrated from float8[] to vector(1536).
--
-- create or replace function public.match_knowledge_chunks(
--   query_embedding vector(1536),
--   similarity_threshold float default 0.75,
--   match_count int default 5
-- )
-- returns table (
--   id uuid, entry_id uuid, content text, metadata jsonb, similarity float
-- )
-- language sql stable as $$
--   select
--     c.id, c.entry_id, c.content, c.metadata,
--     1 - (c.embedding <=> query_embedding) as similarity
--   from public.ai_knowledge_chunks c
--   join public.ai_knowledge_entries e on e.id = c.entry_id
--   where e.is_active = true
--     and 1 - (c.embedding <=> query_embedding) > similarity_threshold
--   order by c.embedding <=> query_embedding
--   limit match_count;
-- $$;

-- Seed: a few bootstrap knowledge entries so the AI has basic facts
-- immediately without requiring an admin upload on first deploy.
insert into public.ai_knowledge_entries
  (title, source_type, raw_content, processing_status, is_active, tags)
values
(
  'Ismail Safwan — Core Profile',
  'manual_note',
  'Ismail Safwan is a robotics and AI engineering student born in 2006. He achieved a high school GPA equivalent of 98.7% and scored 95 out of 100 on the Qudurat aptitude exam. His personality type is INTJ (The Architect). He is passionate about robotics, mechatronics, artificial intelligence, engineering, and languages. He speaks Arabic natively and English fluently. He is planning to study abroad at world-class universities such as MIT, ETH Zurich, Stanford, TU Munich, and Imperial College London. His long-term goal is to lead research in autonomous systems and AI-driven robotics while empowering the next generation of engineers from underrepresented regions.',
  'embedded',
  true,
  array['profile','core','bio']
),
(
  'Ismail Safwan — Philosophy and Principles',
  'manual_note',
  'Ismail operates on a set of core principles: Excellence is built in habits not moments. Discipline is more reliable than motivation. Long-term thinking is the ultimate competitive advantage. Build things that outlast you. Understanding systems deeply before proposing improvements. The quality of your questions determines the quality of your thinking. Comfort is the enemy of growth.',
  'embedded',
  true,
  array['philosophy','principles','mindset']
),
(
  'Ismail Safwan — Projects and Work',
  'manual_note',
  'Ismail is actively building: (1) An Autonomous Navigation System using ROS2, LIDAR, and computer vision for outdoor terrain navigation. (2) An AI Academic Assistant using RAG and LLMs to process academic papers and generate personalized study paths. He has completed a Mechatronic Arm Controller — a 6-DOF robotic arm with a real-time inverse kinematics solver built on STM32. He is planning a Multilingual Learning Platform using Next.js, Supabase, and AI for adaptive language acquisition.',
  'embedded',
  true,
  array['projects','engineering','ai','robotics']
);
