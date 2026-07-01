// src/app/[locale]/admin/analytics/page.tsx
import { adminGetAnalyticsSummary } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { AnalyticsDashboardClient } from '@/components/admin/analytics/AnalyticsDashboardClient'

export default async function AdminAnalyticsPage() {
  const summary = await adminGetAnalyticsSummary()

  return (
    <div>
      <PageHeader title="Analytics" description="First-party visitor analytics — no third-party tracking" />
      <AnalyticsDashboardClient summary={summary} />
    </div>
  )
}
