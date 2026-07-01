// src/app/api/admin/analytics/refresh/route.ts
// Triggers REFRESH MATERIALIZED VIEW for analytics_daily_summary.
// Two callers:
//   1. An admin clicking "Refresh" on the Analytics dashboard (session cookie auth)
//   2. A Vercel Cron Job hitting this route on a schedule (CRON_SECRET auth)

import { NextRequest } from 'next/server'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { refreshAnalyticsSummary } from '@/services'

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('x-cron-secret')
    const isCronCall = cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET

    if (!isCronCall) {
      await requireAuth()
    }

    await refreshAnalyticsSummary()
    return successResponse({ refreshed: true, at: new Date().toISOString() })
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Refresh failed', 500)
  }
}
