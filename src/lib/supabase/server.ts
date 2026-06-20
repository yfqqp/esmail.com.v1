// src/lib/supabase/server.ts
// Server-side Supabase client using @supabase/ssr cookie-based auth.
// Use this in: Server Components, Route Handlers, middleware.
// Never import this file into Client Components.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — benign, middleware handles refresh
          }
        },
      },
    }
  )
}

// Service-role client — bypasses RLS entirely.
// Use ONLY in trusted server-side contexts (background jobs, admin seed scripts,
// AI embedding pipeline). NEVER expose to the browser or use in Route Handlers
// that respond to user-supplied input without additional authorization checks.
export function createServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: { persistSession: false },
    }
  )
}
