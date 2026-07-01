// src/app/[locale]/admin/layout.tsx
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { isAuthenticated } from '@/lib/auth/helpers'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'

// force-dynamic is required here because isAuthenticated() reads the
// session cookie via cookies() (next/headers), which is a genuine
// per-request dependency — not because this route queries the database.
// cookies() usage alone is sufficient to opt a route out of static
// rendering in Next.js 15; this declaration makes that explicit rather
// than relying on the implicit opt-out, which keeps intent clear in code.
export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Middleware already redirects unauthenticated requests to /login before
  // this layout ever renders, but this check is kept as defense-in-depth —
  // a single source of truth (verifySession) is shared by both, so there is
  // no risk of the two checks drifting out of sync over time.
  const authed = await isAuthenticated()
  if (!authed) redirect(`/${locale}/login`)

  return (
    <div className="flex min-h-screen bg-void">
      <AdminSidebar locale={locale} />
      <main className="flex-1 overflow-y-auto p-7">{children}</main>
    </div>
  )
}
