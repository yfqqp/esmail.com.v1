// src/lib/db/pool.ts
// Direct PostgreSQL connection (via `pg`), replacing the Supabase JS SDK now
// that Supabase Auth is no longer used. The database can still be hosted on
// Supabase (it's just managed Postgres) — this connects to it with a plain
// connection string instead of going through Supabase's auth-coupled client.
//
// Why a real connection pool instead of Supabase's PostgREST-over-HTTP
// client: with no Supabase Auth JWT per request, there's no natural way to
// let PostgREST's RLS distinguish "the authenticated owner" from "anonymous"
// — every RLS policy on writes is now `using (false)` (see migration 013).
// Application-layer auth (requireAuth() validating the session cookie)
// becomes the actual gate, and this pooled connection executes queries
// with that gate already having been checked by the caller.

import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. See .env.example.')
  }
  return new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  })
}

// Reuse a single pool across hot-reloads in dev and across warm serverless
// invocations in production — creating a new Pool per request would exhaust
// Postgres connection limits almost immediately on Vercel.
export const pool = globalThis.__pgPool ?? createPool()
if (process.env.NODE_ENV !== 'production') globalThis.__pgPool = pool

/** Run a parameterized query. Always use parameterized queries — never string-interpolate user input into SQL. */
export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}

/** Run a single-row query, returns null if no row matched. */
export async function queryOne<T extends object = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}
