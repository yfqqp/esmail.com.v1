// src/app/api/admin/analytics/route.ts
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetAnalyticsSummary } from '@/services'

export async function GET() {
  try {
    await requireAuth()
    const summary = await adminGetAnalyticsSummary()
    return successResponse(summary)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}
