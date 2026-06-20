// src/app/[locale]/admin/certificates/page.tsx
import { getPublishedAchievements } from '@/services'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/shared/ui'
import { CertificatesManagerClient } from '@/components/admin/certificates/CertificatesManagerClient'

async function getAllAchievements() {
  const supabase = await createClient()
  const { data } = await supabase.from('achievements').select('*').order('sort_order')
  return data ?? []
}

export default async function AdminCertificatesPage() {
  const items = await getAllAchievements()
  return (
    <div>
      <PageHeader title="Certificates & Achievements" description="Certificates, scholarships, competitions, and awards" />
      <CertificatesManagerClient initial={items} />
    </div>
  )
}
