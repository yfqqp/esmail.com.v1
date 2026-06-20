// src/app/[locale]/admin/layout.tsx
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getCurrentUser()

  // Middleware already redirects unauthenticated users to /login, but we
  // re-check here for defense-in-depth and to enforce the role floor
  // (editor minimum) for entering the admin shell at all.
  if (!user) redirect(`/${locale}/login`)

  const role = user.profile?.role ?? 'viewer'
  if (!['owner', 'admin', 'editor'].includes(role)) {
    redirect(`/${locale}?error=insufficient_permissions`)
  }

  return (
    <div className="flex min-h-screen bg-void">
      <AdminSidebar locale={locale} userEmail={user.email} />
      <main className="flex-1 overflow-y-auto p-7">{children}</main>
    </div>
  )
}
