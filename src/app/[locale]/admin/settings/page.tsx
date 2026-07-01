// src/app/[locale]/admin/settings/page.tsx
import { getSiteSettings } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { SettingsManagerClient } from '@/components/admin/settings/SettingsManagerClient'

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div>
      <PageHeader title="Settings" description="General site configuration, contact info, social links, and feature flags" />
      <SettingsManagerClient initial={settings} />
    </div>
  )
}
