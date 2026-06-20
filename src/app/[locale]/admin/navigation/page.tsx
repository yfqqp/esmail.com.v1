// src/app/[locale]/admin/navigation/page.tsx
import { adminGetAllNavItems } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { NavigationManagerClient } from '@/components/admin/navigation/NavigationManagerClient'

export default async function AdminNavigationPage() {
  const items = await adminGetAllNavItems()
  return (
    <div>
      <PageHeader title="Navigation" description="Menu items, order, and visibility for the site header" />
      <NavigationManagerClient initial={items} />
    </div>
  )
}
