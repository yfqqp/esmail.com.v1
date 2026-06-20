-- ============================================================================
-- Migration 011: Row Level Security Policies
-- ============================================================================
-- RLS is the primary security boundary between the public internet and the
-- database. Rules: anonymous users can only SELECT published/visible rows.
-- editor+ can write content tables. admin+ can write settings/theme/users.
-- owner only can manage other users' roles.
-- ============================================================================

-- Enable RLS on every table --------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.media_items         enable row level security;
alter table public.sections            enable row level security;
alter table public.projects            enable row level security;
alter table public.achievements        enable row level security;
alter table public.timeline_events     enable row level security;
alter table public.blog_posts          enable row level security;
alter table public.quotes              enable row level security;
alter table public.ai_knowledge_entries enable row level security;
alter table public.ai_knowledge_chunks  enable row level security;
alter table public.theme_settings      enable row level security;
alter table public.navigation_items    enable row level security;
alter table public.seo_settings        enable row level security;
alter table public.site_settings       enable row level security;
alter table public.analytics_events    enable row level security;
alter table public.languages           enable row level security;

-- ── profiles ─────────────────────────────────────────────────────────────────
create policy "profiles: public cannot read" on public.profiles
  for select using (false);

create policy "profiles: own row readable" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: owner sees all" on public.profiles
  for select using (public.is_admin_or_above());

create policy "profiles: own row updatable" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));
  -- ↑ prevents self-promotion; role change requires owner action

create policy "profiles: owner manages roles" on public.profiles
  for update using ((select role from public.profiles where id = auth.uid()) = 'owner')
  with check (true);

-- ── languages (public read, admin write) ─────────────────────────────────────
create policy "languages: public read active" on public.languages
  for select using (is_active = true);

create policy "languages: admin write" on public.languages
  for all using (public.is_admin_or_above());

-- ── sections (public read visible, editor+ write) ────────────────────────────
create policy "sections: public read visible" on public.sections
  for select using (is_visible = true);

create policy "sections: editor read all" on public.sections
  for select using (public.is_editor_or_above());

create policy "sections: editor write" on public.sections
  for all using (public.is_editor_or_above());

-- ── media items ──────────────────────────────────────────────────────────────
create policy "media: public read" on public.media_items
  for select using (true);

create policy "media: editor write" on public.media_items
  for all using (public.is_editor_or_above());

-- ── projects ─────────────────────────────────────────────────────────────────
create policy "projects: public read published" on public.projects
  for select using (content_status = 'published');

create policy "projects: editor read all" on public.projects
  for select using (public.is_editor_or_above());

create policy "projects: editor write" on public.projects
  for all using (public.is_editor_or_above());

-- ── achievements ─────────────────────────────────────────────────────────────
create policy "achievements: public read published" on public.achievements
  for select using (content_status = 'published');

create policy "achievements: editor write" on public.achievements
  for all using (public.is_editor_or_above());

-- ── timeline_events ──────────────────────────────────────────────────────────
create policy "timeline: public read published" on public.timeline_events
  for select using (content_status = 'published');

create policy "timeline: editor write" on public.timeline_events
  for all using (public.is_editor_or_above());

-- ── blog_posts ────────────────────────────────────────────────────────────────
create policy "blog: public read published" on public.blog_posts
  for select using (content_status = 'published');

create policy "blog: editor read all" on public.blog_posts
  for select using (public.is_editor_or_above());

create policy "blog: editor write" on public.blog_posts
  for all using (public.is_editor_or_above());

-- ── quotes ────────────────────────────────────────────────────────────────────
create policy "quotes: public read published" on public.quotes
  for select using (content_status = 'published');

create policy "quotes: editor write" on public.quotes
  for all using (public.is_editor_or_above());

-- ── AI knowledge base ─────────────────────────────────────────────────────────
-- Chunks are readable by the API route (service role key), not by anonymous
-- browsers. Entries list is admin-only.
create policy "ai_entries: admin only" on public.ai_knowledge_entries
  for all using (public.is_admin_or_above());

create policy "ai_chunks: no direct public access" on public.ai_knowledge_chunks
  for select using (false);   -- accessed only via service-role in API route

create policy "ai_chunks: admin write" on public.ai_knowledge_chunks
  for all using (public.is_admin_or_above());

-- ── theme, nav, seo, site settings ───────────────────────────────────────────
create policy "theme: public read active" on public.theme_settings
  for select using (is_active = true);

create policy "theme: admin write" on public.theme_settings
  for all using (public.is_admin_or_above());

create policy "nav: public read visible" on public.navigation_items
  for select using (is_visible = true);

create policy "nav: editor write" on public.navigation_items
  for all using (public.is_editor_or_above());

create policy "seo: public read" on public.seo_settings
  for select using (true);

create policy "seo: admin write" on public.seo_settings
  for all using (public.is_admin_or_above());

create policy "site_settings: public read" on public.site_settings
  for select using (true);

create policy "site_settings: admin write" on public.site_settings
  for all using (public.is_admin_or_above());

-- ── analytics ────────────────────────────────────────────────────────────────
-- Public can insert (page view tracking). Nobody can read raw events except admins.
create policy "analytics: public insert" on public.analytics_events
  for insert with check (true);

create policy "analytics: admin read" on public.analytics_events
  for select using (public.is_admin_or_above());
