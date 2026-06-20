-- ============================================================================
-- Migration 002: Users, Roles, and Profile Linkage
-- ============================================================================
-- Supabase Auth owns the `auth.users` table (email, password hash, sessions).
-- We never duplicate credentials. This migration adds a `profiles` table that
-- extends each auth user with app-specific data (role, display name, avatar)
-- and is kept in sync via a trigger on auth.users insert.
-- ============================================================================

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  avatar_url    text,
  role          app_role not null default 'viewer',
  is_active     boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Extends auth.users with application role and profile data. One row per Supabase Auth user.';
comment on column public.profiles.role is
  'owner: full control incl. user management. admin: full CMS access. editor: content only, no settings/users. viewer: read-only (future use for collaborators).';

create index idx_profiles_role on public.profiles(role);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-create a profile row whenever a new Supabase Auth user signs up.
-- The very first user to ever sign up is automatically promoted to 'owner';
-- every subsequent signup defaults to 'viewer' until an owner/admin upgrades
-- them. This avoids a chicken-and-egg bootstrap problem on first deploy.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select not exists(select 1 from public.profiles) into is_first_user;

  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when is_first_user then 'owner'::app_role else 'viewer'::app_role end
  );

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

comment on function public.handle_new_auth_user() is
  'Bootstraps a profiles row on signup. First-ever user becomes owner automatically; all others start as viewer pending promotion.';

-- ----------------------------------------------------------------------------
-- Helper functions used heavily by RLS policies in later migrations.
-- Defined here so every policy file can reference them.
-- ----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns app_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin_or_above()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role in ('owner', 'admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_editor_or_above()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role in ('owner', 'admin', 'editor') from public.profiles where id = auth.uid()),
    false
  );
$$;

comment on function public.is_admin_or_above() is
  'RLS helper: true if the requesting JWT belongs to an owner or admin. Used to gate settings/users/theme tables.';
comment on function public.is_editor_or_above() is
  'RLS helper: true if the requesting JWT belongs to owner/admin/editor. Used to gate day-to-day content tables.';
