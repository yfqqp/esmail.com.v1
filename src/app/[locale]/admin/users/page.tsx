// src/app/[locale]/admin/users/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/shared/ui'
import { UsersManagerClient } from '@/components/admin/users/UsersManagerClient'

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/${locale}/login`)

  // Editors should not see the user roster at all (admin+ only)
  const role = user.profile?.role ?? 'viewer'
  if (!['owner', 'admin'].includes(role)) redirect(`/${locale}/admin`)

  const supabase = await createClient()
  const { data: users } = await supabase.from('profiles').select('*').order('created_at')

  return (
    <div>
      <PageHeader title="Users" description="Team members and role-based access control" />
      <UsersManagerClient initial={users ?? []} currentUserId={user.id} isOwner={role === 'owner'} />
    </div>
  )
}
