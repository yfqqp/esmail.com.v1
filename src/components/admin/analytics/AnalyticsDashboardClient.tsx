// src/components/admin/analytics/AnalyticsDashboardClient.tsx
'use client'

import { AdminCard } from '@/components/admin/shared/ui'

interface AnalyticsSummary {
  totalViews: number
  uniqueSessions: number
  topPages: Array<{ page_path: string; event_count: number }>
  viewsByDay: Array<{ day: string; event_count: number }>
}

export function AnalyticsDashboardClient({ summary }: { summary: AnalyticsSummary }) {
  const maxDayCount = Math.max(...summary.viewsByDay.map(d => d.event_count), 1)

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <AdminCard>
          <div className="text-dimmer text-xs mb-2">Total Page Views</div>
          <div className="font-display text-3xl font-extrabold text-[var(--color-text)]">{summary.totalViews.toLocaleString()}</div>
        </AdminCard>
        <AdminCard>
          <div className="text-dimmer text-xs mb-2">Unique Sessions</div>
          <div className="font-display text-3xl font-extrabold text-[var(--color-text)]">{summary.uniqueSessions.toLocaleString()}</div>
        </AdminCard>
        <AdminCard>
          <div className="text-dimmer text-xs mb-2">Top Page</div>
          <div className="font-display text-lg font-bold text-[var(--color-text)] truncate">
            {summary.topPages[0]?.page_path ?? '—'}
          </div>
        </AdminCard>
      </div>

      <AdminCard className="mb-6">
        <div className="text-[var(--color-text)] text-sm font-semibold mb-5">Views — Last 30 Days</div>
        {summary.viewsByDay.length === 0 ? (
          <p className="text-muted text-xs">No analytics data yet. Data populates as visitors arrive.</p>
        ) : (
          <div className="flex items-end gap-1 h-[140px]">
            {summary.viewsByDay.slice().reverse().map((d, i) => (
              <div
                key={i}
                className="flex-1 bg-accent rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${Math.max((d.event_count / maxDayCount) * 100, 4)}%` }}
                title={`${d.day}: ${d.event_count} views`}
              />
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard>
        <div className="text-[var(--color-text)] text-sm font-semibold mb-4">Top Pages</div>
        {summary.topPages.length === 0 ? (
          <p className="text-muted text-xs">No page data yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {summary.topPages.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-[var(--color-text)] text-[13px]">{p.page_path}</span>
                <span className="text-accent text-[13px] font-semibold">{p.event_count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  )
}
