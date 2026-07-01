// src/app/[locale]/admin/seo/page.tsx
import { adminGetAllSEOSettings } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { SEOManagerClient } from '@/components/admin/seo/SEOManagerClient'

export default async function AdminSEOPage() {
  const data = await adminGetAllSEOSettings()
  return (
    <div>
      <PageHeader title="SEO" description="Titles, descriptions, Open Graph data, and indexing per page" />
      <SEOManagerClient initial={data} />
    </div>
  )
}
