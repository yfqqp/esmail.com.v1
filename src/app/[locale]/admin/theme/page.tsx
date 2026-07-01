// src/app/[locale]/admin/theme/page.tsx
import { getActiveTheme } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { ThemeManagerClient } from '@/components/admin/theme-manager/ThemeManagerClient'

export default async function AdminThemePage() {
  const theme = await getActiveTheme()

  if (!theme) {
    return (
      <div>
        <PageHeader title="Theme" description="Colors and typography" />
        <p className="text-muted text-sm">No active theme found. Run database migrations to seed the default theme.</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Theme" description="Customize colors and typography — applies site-wide instantly" />
      <ThemeManagerClient initial={theme} />
    </div>
  )
}
