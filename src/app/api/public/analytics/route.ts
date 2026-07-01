// src/app/api/public/analytics/route.ts
// Public, unauthenticated endpoint that the SiteAnalyticsBeacon component
// calls on every page load. Intentionally minimal — no PII, no third-party
// transmission, first-party only.

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { trackEvent } from '@/services'
import { checkRateLimit, getClientIdentifier } from '@/lib/utils/rate-limit'

const bodySchema = z.object({
  event_type: z.string().min(1).max(50),
  page_path: z.string().min(1).max(500),
  referrer: z.string().max(500).optional(),
  session_id: z.string().max(100).optional(),
})

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req)
  const rateLimit = checkRateLimit(`analytics:${clientId}`, 60, 60 * 1000) // 60 events / minute
  if (!rateLimit.allowed) {
    return Response.json({ success: true }, { status: 202 }) // silently drop, never error to visitor
  }

  try {
    const body = bodySchema.parse(await req.json())
    await trackEvent(body)
    return Response.json({ success: true }, { status: 202 })
  } catch {
    // Analytics failures should never surface to the visitor
    return Response.json({ success: true }, { status: 202 })
  }
}
