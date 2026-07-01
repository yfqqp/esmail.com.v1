// src/app/api/auth/verify-otp/route.ts
// Step 2 of the OTP flow: verifies the submitted 6-digit code against the
// record created in step 1. On success, issues a signed HttpOnly session
// cookie (see lib/auth/session.ts) and the client redirects to /admin.

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { verifyOtp } from '@/lib/auth/otp'
import { createSession } from '@/lib/auth/session-server'
import { checkRateLimit, getClientIdentifier } from '@/lib/utils/rate-limit'
import { errorResponse, successResponse } from '@/lib/auth/helpers'

const bodySchema = z.object({
  otpId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
})

const REASON_MESSAGES: Record<string, string> = {
  not_found: 'This verification session is invalid. Please request a new code.',
  expired: 'This code has expired. Please request a new one.',
  already_used: 'This code has already been used. Please request a new one.',
  too_many_attempts: 'Too many incorrect attempts. Please request a new code.',
  invalid_code: 'Incorrect code. Please try again.',
}

export async function POST(req: NextRequest) {
  // A second, independent rate limit on verification attempts — separate
  // from the OTP's own internal max_attempts counter — protects against a
  // distributed brute force across many freshly-requested OTPs.
  const clientId = getClientIdentifier(req)
  const rateLimit = checkRateLimit(`otp-verify:${clientId}`, 15, 10 * 60 * 1000)
  if (!rateLimit.allowed) {
    return errorResponse('Too many verification attempts. Please wait a few minutes.', 429)
  }

  try {
    const { otpId, code } = bodySchema.parse(await req.json())

    const result = await verifyOtp(otpId, code)
    if (!result.ok) {
      return errorResponse(REASON_MESSAGES[result.reason] ?? 'Verification failed.', 401)
    }

    await createSession({
      userAgent: req.headers.get('user-agent') ?? undefined,
      ipAddress: clientId,
    })

    return successResponse({ verified: true })
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Verification failed.', 400)
  }
}
