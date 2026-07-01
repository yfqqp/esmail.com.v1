// src/app/[locale]/admin/certificates/page.tsx
import { adminGetAllAchievements } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { CertificatesManagerClient } from '@/components/admin/certificates/CertificatesManagerClient'

export default async function AdminCertificatesPage() {
  const items = await adminGetAllAchievements()
  return (
    <div>
      <PageHeader title="Certificates & Achievements" description="Certificates, scholarships, competitions, and awards" />
      <CertificatesManagerClient initial={items} />
    </div>
  )
}
