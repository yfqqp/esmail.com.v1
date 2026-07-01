// src/app/api/auth/login/route.ts
// Step 1 of the OTP flow: generates a code, delivers it via the requested
// channel (email or telegram), and returns only the OTP record's id (never
// the code itself) for the client to submit alongside the code in step 2.

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createOtp } from '@/lib/auth/otp'
import { sendOtpViaEmail } from '@/lib/auth/delivery/email'
import { sendOtpViaTelegram } from '@/lib/auth/delivery/telegram'
import { queryOne } from '@/lib/db/pool'
import { checkRateLimit, getClientIdentifier } from '@/lib/utils/rate-limit'
import { errorResponse, successResponse } from '@/lib/auth/helpers'

const bodySchema = z.object({
  method: z.enum(['email', 'telegram']),
})

export async function POST(req: NextRequest) {
  // Rate limit OTP requests aggressively per-IP — this endpoint sends a
  // real email/Telegram message and is a cost + spam vector if unbounded.
  const clientId = getClientIdentifier(req)
  const rateLimit = checkRateLimit(`otp-request:${clientId}`, 5, 10 * 60 * 1000) // 5 requests / 10 min
  if (!rateLimit.allowed) {
    return errorResponse('Too many login attempts. Please wait a few minutes and try again.', 429)
  }

  try {
    const { method } = bodySchema.parse(await req.json())

    const owner = await queryOne<{ email: string; telegram_chat_id: string | null }>(
      `select email, telegram_chat_id from public.owner_account limit 1`
    )
    if (!owner) {
      return errorResponse('No owner account is configured yet. See docs/DEPLOYMENT.md.', 503)
    }
    if (method === 'telegram' && !owner.telegram_chat_id) {
      return errorResponse('Telegram delivery is not configured for this account.', 400)
    }

    const otp = await createOtp(method)

    if (method === 'email') {
      await sendOtpViaEmail(owner.email, otp.code, 5)
    } else {
      await sendOtpViaTelegram(otp.code, 5)
    }

    // Never return the plaintext code in the response — only the record id
    // the client needs to submit alongside the code the user received.
    return successResponse({ otpId: otp.id, deliveredVia: method, expiresInMinutes: 5 })
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to send verification code.', 500)
  }
}
