// src/app/[locale]/admin/timeline/page.tsx
import { adminGetAllTimelineEvents } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { TimelineManagerClient } from '@/components/admin/timeline/TimelineManagerClient'

export default async function AdminTimelinePage() {
  const events = await adminGetAllTimelineEvents()
  return (
    <div>
      <PageHeader title="Timeline" description="Life milestones and chronological journey events" />
      <TimelineManagerClient initial={events} />
    </div>
  )
}
