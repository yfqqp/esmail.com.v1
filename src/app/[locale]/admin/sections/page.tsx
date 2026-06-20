// src/app/[locale]/admin/sections/page.tsx
import { adminGetAllSections } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { SectionManagerClient } from '@/components/admin/section-manager/SectionManagerClient'

export default async function AdminSectionsPage() {
  const sections = await adminGetAllSections()

  return (
    <div>
      <PageHeader
        title="Section Manager"
        description="Drag to reorder · Toggle visibility · Edit content — changes reflect live on the site"
      />
      <SectionManagerClient initialSections={sections} />
    </div>
  )
}
