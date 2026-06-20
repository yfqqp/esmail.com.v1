// src/app/[locale]/admin/timeline/page.tsx
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/shared/ui'
import { TimelineManagerClient } from '@/components/admin/timeline/TimelineManagerClient'

export default async function AdminTimelinePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('timeline_events').select('*').order('sort_order')

  return (
    <div>
      <PageHeader title="Timeline" description="Life milestones and chronological journey events" />
      <TimelineManagerClient initial={data ?? []} />
    </div>
  )
}
