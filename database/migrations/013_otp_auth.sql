-- ============================================================================
-- Migration 013: Single-Owner OTP Authentication (replaces Supabase Auth)
-- ============================================================================
-- This project has exactly one administrator. There is no registration,
-- no multi-user role hierarchy, and no Supabase Auth / OAuth dependency.
-- Authentication is a server-issued 6-digit OTP delivered via Telegram or
-- email (Resend), verified server-side, then exchanged for a signed,
-- HttpOnly session cookie (JWT via `jose`, validated in middleware).
--
-- This migration:
--   1. Drops the profiles/roles system and its auth.users trigger (migration
--      002) — there is no more `auth` schema dependency at all.
--   2. Drops every "is_editor_or_above()" / "is_admin_or_above()" RLS policy
--      (migration 011) and replaces them with a single boolean check against
--      a server-set Postgres session variable, since there is no longer a
--      Supabase Auth JWT for RLS to inspect `auth.uid()` from.
--   3. Creates `owner_account` (exactly one row, enforced), `otp_codes`, and
--      `auth_sessions` tables.
--
-- IMPORTANT: because there is no more `auth.users`/Supabase Auth JWT, RLS
-- can no longer distinguish "admin" from "anonymous" using `auth.uid()`.
-- All write protection now happens at the application layer (every mutating
-- API route calls requireAuth(), which validates the session cookie before
-- touching the database) using the Postgres service-role-equivalent
-- connection. Public SELECT policies (published-only content) are preserved
-- as-is since those never depended on auth.uid() to begin with.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: tear down the old multi-user auth system
-- ----------------------------------------------------------------------------
-- "drop trigger if exists ... on auth.users" would fail outright (not just
-- no-op) if the `auth` schema doesn't exist at all — `if exists` only
-- guards the trigger name, not a missing schema/table reference. This
-- project is documented to run against Supabase-hosted Postgres (which
-- always has the `auth` schema), but this guard makes the migration safe
-- to run on any plain Postgres instance too.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'auth')
     and exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    execute 'drop trigger if exists trg_on_auth_user_created on auth.users';
  end if;
end;
$$;

drop function if exists public.handle_new_auth_user();
drop function if exists public.current_user_role();
drop function if exists public.is_admin_or_above();
drop function if exists public.is_editor_or_above();

-- Drop every RLS policy that referenced the old role helper functions.
-- (Postgres requires policies to be dropped before the functions/columns
-- they reference can be safely removed; functions above are already gone,
-- so any policy still calling them would now be broken — drop explicitly.)
drop policy if exists "profiles: public cannot read" on public.profiles;
drop policy if exists "profiles: own row readable" on public.profiles;
drop policy if exists "profiles: owner sees all" on public.profiles;
drop policy if exists "profiles: own row updatable" on public.profiles;
drop policy if exists "profiles: owner manages roles" on public.profiles;
drop policy if exists "languages: admin write" on public.languages;
drop policy if exists "sections: editor read all" on public.sections;
drop policy if exists "sections: editor write" on public.sections;
drop policy if exists "media: editor write" on public.media_items;
drop policy if exists "projects: editor read all" on public.projects;
drop policy if exists "projects: editor write" on public.projects;
drop policy if exists "achievements: editor write" on public.achievements;
drop policy if exists "timeline: editor write" on public.timeline_events;
drop policy if exists "blog: editor read all" on public.blog_posts;
drop policy if exists "blog: editor write" on public.blog_posts;
drop policy if exists "quotes: editor write" on public.quotes;
drop policy if exists "ai_entries: admin only" on public.ai_knowledge_entries;
drop policy if exists "ai_chunks: admin write" on public.ai_knowledge_chunks;
drop policy if exists "theme: admin write" on public.theme_settings;
drop policy if exists "nav: editor write" on public.navigation_items;
drop policy if exists "seo: admin write" on public.seo_settings;
drop policy if exists "site_settings: admin write" on public.site_settings;
drop policy if exists "analytics: admin read" on public.analytics_events;
drop policy if exists "analytics_summary: admin read only" on public.analytics_daily_summary;

-- Drop the profiles table entirely — single-owner means no user roster.
drop table if exists public.profiles cascade;

-- created_by/uploaded_by/author_id columns referenced profiles.id; drop the
-- now-dangling foreign keys but keep the columns as plain nullable uuid for
-- historical record-keeping (harmless, avoids a wider migration).
alter table public.sections              drop constraint if exists sections_created_by_fkey;
alter table public.projects              drop constraint if exists projects_created_by_fkey;
alter table public.achievements          drop constraint if exists achievements_created_by_fkey;
alter table public.timeline_events       drop constraint if exists timeline_events_created_by_fkey;
alter table public.blog_posts            drop constraint if exists blog_posts_author_id_fkey;
alter table public.media_items           drop constraint if exists media_items_uploaded_by_fkey;
alter table public.ai_knowledge_entries  drop constraint if exists ai_knowledge_entries_created_by_fkey;
alter table public.site_settings         drop constraint if exists site_settings_updated_by_fkey;

-- ----------------------------------------------------------------------------
-- Step 2: the single owner account
-- ----------------------------------------------------------------------------
-- Exactly one row, ever. Email/Telegram chat ID are configured once at
-- deploy time (via a seed insert you run yourself with your real values —
-- never hardcoded in this migration file). No password is stored: OTP is
-- the only credential, generated fresh per login.
create table public.owner_account (
  id              boolean primary key default true,
  email           text not null,
  telegram_chat_id text,
  created_at      timestamptz not null default now(),
  constraint owner_account_singleton check (id = true)
);

comment on table public.owner_account is
  'Exactly one row (enforced by the boolean primary key + check constraint). The single administrator''s contact info for OTP delivery. No password — OTP only.';

-- ----------------------------------------------------------------------------
-- Step 3: OTP codes
-- ----------------------------------------------------------------------------
create table public.otp_codes (
  id            uuid primary key default gen_random_uuid(),
  code_hash     text not null,             -- sha256 of the 6-digit code, never store plaintext
  delivery_method text not null check (delivery_method in ('email', 'telegram')),
  attempts      integer not null default 0,
  max_attempts  integer not null default 5,
  expires_at    timestamptz not null,
  consumed_at   timestamptz,               -- set once successfully verified; codes are single-use
  created_at    timestamptz not null default now()
);

comment on table public.otp_codes is
  'Short-lived one-time codes for login. Only the SHA-256 hash is stored. Expires after 5 minutes (enforced at the application layer when generating expires_at), max 5 verification attempts.';

create index idx_otp_codes_expires on public.otp_codes(expires_at);

-- ----------------------------------------------------------------------------
-- Step 4: sessions
-- ----------------------------------------------------------------------------
-- The session cookie itself is a signed JWT (via `jose`), so the cookie's
-- signature is sufficient to trust its contents without a DB lookup on every
-- request. This table exists purely so a session can be explicitly revoked
-- (e.g. "sign out everywhere") before its natural JWT expiry — middleware
-- checks the JWT signature/expiry only (fast, no DB hit); explicit
-- revocation checks (if ever needed) would consult this table.
create table public.auth_sessions (
  id            uuid primary key default gen_random_uuid(),
  session_hash  text not null unique,      -- sha256 of the session token embedded in the JWT
  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now(),
  user_agent    text,
  ip_address    text
);

comment on table public.auth_sessions is
  'Audit trail / revocation list for issued sessions. The session cookie is a self-contained signed JWT validated by signature in middleware; this table is consulted only for explicit revocation, not on every request.';

create index idx_auth_sessions_expires on public.auth_sessions(expires_at);
create index idx_auth_sessions_hash on public.auth_sessions(session_hash);

-- ----------------------------------------------------------------------------
-- Step 5: cleanup function for expired OTPs/sessions (call on a schedule or
-- opportunistically from the OTP-generation code path)
-- ----------------------------------------------------------------------------
create or replace function public.cleanup_expired_auth_records()
returns void
language sql
as $$
  delete from public.otp_codes where expires_at < now() - interval '1 day';
  delete from public.auth_sessions where expires_at < now() - interval '1 day';
$$;

-- ----------------------------------------------------------------------------
-- Step 6: re-enable RLS write protection without auth.uid()
-- ----------------------------------------------------------------------------
-- Without Supabase Auth, Postgres RLS has no JWT to inspect per-request.
-- The correct, secure approach here is: the application's database
-- connection for write operations uses a role/connection that has already
-- been authenticated at the API layer (requireAuth() checks the session
-- cookie before any query runs), so RLS's job narrows to "public read of
-- published content only, no public writes at all" — which is exactly what
-- these policies enforce. There is no "editor" or "admin" distinction
-- anymore; the API layer's requireAuth() is the only gate, and it is binary
-- (authenticated owner, or not).
create policy "sections: owner write only" on public.sections
  for all using (false) with check (false);
  -- Mutations happen exclusively through the API layer using the
  -- service/admin Postgres connection, which is configured to bypass RLS
  -- (see lib/db/pool.ts) after requireAuth() has already verified the
  -- session. This policy intentionally blocks the anon/authenticated
  -- Postgres roles from writing under any circumstance.

create policy "media: owner write only" on public.media_items
  for all using (false) with check (false);

create policy "projects: owner write only" on public.projects
  for all using (false) with check (false);

create policy "achievements: owner write only" on public.achievements
  for all using (false) with check (false);

create policy "timeline: owner write only" on public.timeline_events
  for all using (false) with check (false);

create policy "blog: owner write only" on public.blog_posts
  for all using (false) with check (false);

create policy "quotes: owner write only" on public.quotes
  for all using (false) with check (false);

create policy "ai_entries: owner only" on public.ai_knowledge_entries
  for all using (false) with check (false);

create policy "ai_chunks: owner write only" on public.ai_knowledge_chunks
  for all using (false) with check (false);

create policy "theme: owner write only" on public.theme_settings
  for all using (false) with check (false);

create policy "nav: owner write only" on public.navigation_items
  for all using (false) with check (false);

create policy "seo: owner write only" on public.seo_settings
  for all using (false) with check (false);

create policy "site_settings: owner write only" on public.site_settings
  for all using (false) with check (false);

create policy "analytics_summary: no public read" on public.analytics_daily_summary
  for select using (false);

create policy "languages: owner write only" on public.languages
  for all using (false) with check (false);

-- Lock down the new auth tables completely — never reachable via the public
-- anon Postgres role under any circumstance, only via the server-side
-- pooled connection used by lib/auth/*.
alter table public.owner_account  enable row level security;
alter table public.otp_codes      enable row level security;
alter table public.auth_sessions  enable row level security;

create policy "owner_account: no public access" on public.owner_account for all using (false) with check (false);
create policy "otp_codes: no public access"     on public.otp_codes     for all using (false) with check (false);
create policy "auth_sessions: no public access" on public.auth_sessions for all using (false) with check (false);

-- ----------------------------------------------------------------------------
-- Step 7: seed the owner account
-- ----------------------------------------------------------------------------
-- Run this insert yourself, once, with your real email and Telegram chat ID
-- — never commit real values into a migration file. Replace the placeholders
-- below before running, or run it as a separate one-off statement in the
-- Supabase SQL Editor instead of as part of this file.
--
-- insert into public.owner_account (id, email, telegram_chat_id)
-- values (true, 'your-real-email@example.com', 'your-real-telegram-chat-id')
-- on conflict (id) do update set email = excluded.email, telegram_chat_id = excluded.telegram_chat_id;
