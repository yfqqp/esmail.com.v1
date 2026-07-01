-- ============================================================================
-- Migration 012: Analytics Materialized View Refresh
-- ============================================================================
-- analytics_daily_summary (migration 010) is a materialized view, which
-- Postgres does NOT auto-update as new rows are inserted into the underlying
-- analytics_events table. Without an explicit refresh, the admin Analytics
-- dashboard would show empty/stale data indefinitely. This migration adds:
--   1. A SECURITY DEFINER function any admin-role caller can invoke on demand
--   2. A pg_cron schedule (if the extension is available on your Supabase
--      plan) to refresh it automatically every hour
--
-- CONCURRENTLY requires a unique index on the materialized view, which we
-- add first so refreshes don't block reads while running.
-- ============================================================================

create unique index if not exists idx_analytics_summary_unique
  on public.analytics_daily_summary (day, page_path, event_type);

-- CRITICAL: materialized views do NOT inherit RLS policies from their
-- underlying tables, and PostgREST exposes every relation in the public
-- schema by default. Without this, analytics_daily_summary — page-path-level
-- traffic data — would be readable by anonymous callers via Supabase's
-- auto-generated REST API even though analytics_events itself is correctly
-- restricted to admin-role reads.
alter materialized view public.analytics_daily_summary enable row level security;

create policy "analytics_summary: admin read only" on public.analytics_daily_summary
  for select using (public.is_admin_or_above());

create or replace function public.refresh_analytics_summary()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.analytics_daily_summary;
end;
$$;

comment on function public.refresh_analytics_summary() is
  'Refreshes analytics_daily_summary from raw analytics_events. Call on a schedule (pg_cron) or manually from an admin action — Postgres does not auto-refresh materialized views.';

-- ----------------------------------------------------------------------------
-- Scheduled refresh via pg_cron (available on Supabase Pro+ and most
-- self-hosted Postgres setups with the extension enabled). If pg_cron is
-- not available on your plan, call public.refresh_analytics_summary() from
-- a Vercel Cron Job hitting a small API route instead — see
-- src/app/api/admin/analytics/refresh/route.ts and docs/DEPLOYMENT.md.
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'refresh-analytics-summary',
      '0 * * * *',  -- every hour
      $cron$select public.refresh_analytics_summary();$cron$
    );
  end if;
end;
$$;
