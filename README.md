# Ismail Safwan — Personal Identity Platform

A production-grade, fully dynamic personal website and CMS. Not a portfolio template — a database-driven block engine where every section of the public site is a row in Postgres, reorderable, hideable, and editable from a custom admin dashboard with zero code changes.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (cookie-based SSR sessions) |
| Media | Cloudinary |
| i18n | next-intl (English, Arabic, Russian) |
| AI | OpenAI (chat + embeddings), RAG-ready via pgvector |
| Hosting | Vercel |

## Architecture in one paragraph

The homepage (`src/app/[locale]/(site)/page.tsx`) renders **zero hardcoded sections**. It fetches all visible rows from the `sections` table ordered by `sort_order`, and for each row dispatches to a React component via `src/components/blocks/registry.tsx` based on `section_type`. Adding, reordering, hiding, renaming, or retiring a section is a database write triggered from `/admin/sections` — never a deploy.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in real keys, see below
npm run dev
```

### Required environment variables

See `.env.example` for the full list. Minimum to run:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `OPENAI_API_KEY` (optional at launch — AI assistant degrades gracefully without it)

### Database setup

Run every file in `database/migrations/` **in numeric order** against your Supabase project, via the SQL Editor or the Supabase CLI:

```bash
supabase db push   # if using the Supabase CLI with linked project
```

Migrations 001–011 create the full schema, RLS policies, and seed the launch content (matching the previously-approved site copy) so the site is immediately functional after migration, before any admin editing happens.

### First admin account

Sign up once via `/login` → "create account" flow (or directly through Supabase Auth dashboard). **The first user ever created is automatically promoted to `owner`** by the `handle_new_auth_user()` trigger in migration 002. Every subsequent signup starts as `viewer` until an owner/admin promotes them from `/admin/users`.

## Directory guide

```
src/
  app/
    [locale]/
      (site)/         ← public website routes (homepage, projects, blog, gallery)
      admin/           ← CMS dashboard (role-gated)
      login/
    api/
      admin/           ← authenticated CRUD routes for every entity
      ai/chat/         ← public AI assistant endpoint
      public/          ← analytics beacon
  components/
    blocks/            ← the 9+ section renderers + registry.tsx (the engine)
    site/               ← nav, footer (public chrome)
    admin/              ← dashboard UI, one folder per CMS module
  lib/
    supabase/           ← server + browser Supabase clients
    cloudinary/          ← media upload service
    ai/                 ← chat + embedding pipeline (RAG-ready)
    auth/                ← role-check helpers used by every API route
    validation/          ← Zod schemas, one per section type + entity
  services/index.ts      ← every database query in the app, in one file
  types/                 ← TypeScript mirror of the SQL schema
database/
  migrations/             ← run in order, idempotent where possible
```

## Adding a new section type (without touching the homepage)

1. Add the new value to the `section_type` Postgres enum (one migration).
2. Add its content TypeScript interface to `src/types/index.ts`.
3. Add a Zod schema to `src/lib/validation/sections.ts`.
4. Build the React component in `src/components/blocks/`.
5. Register it in `src/components/blocks/registry.tsx` (`RenderSection` switch + `SECTION_TYPE_META`).
6. (Optional) Add a custom admin editor in `SectionEditorPanel.tsx`; otherwise it falls back to a raw JSON editor automatically.

The homepage, the section manager, and the reorder/hide/rename APIs require **no changes** — they're already generic.

## Activating the AI Assistant

The AI is architected but dormant by default (degrades to "setup required" in the UI). To activate:

1. Set `OPENAI_API_KEY` in your environment.
2. Visit `/admin/ai-knowledge`, review the seeded knowledge entries (or add your own).
3. Click **Embed** on each entry — this chunks the text and stores embeddings via the pipeline in `src/lib/ai/chat.ts`.
4. (Optional, for real vector search) Enable the `pgvector` extension in your Supabase project dashboard, then migrate `ai_knowledge_chunks.embedding_raw` from `float8[]` to a proper `vector(1536)` column and uncomment the `match_knowledge_chunks` SQL function in migration 009. Until then, the assistant falls back to stuffing all embedded entries directly into the system prompt — fine at the current content volume, but vector search scales better past ~20 entries.

See `docs/DEPLOYMENT.md` for the full production checklist and `docs/AI_ACTIVATION.md` for a deeper walkthrough.
