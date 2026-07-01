// src/lib/auth/otp.ts
// Generates, stores (as a hash, never plaintext), and verifies 6-digit OTP
// codes. No code is ever logged, returned from an API response, or stored
// in reversible form — only its SHA-256 hash lives in the database.

import { randomInt, createHash } from 'crypto'
import { query, queryOne } from '@/lib/db/pool'

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 5
const MAX_ATTEMPTS = 5

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

function generateCode(): string {
  // randomInt is cryptographically secure (Node's crypto module), unlike Math.random()
  return randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, '0')
}

export interface GeneratedOtp {
  id: string
  code: string        // plaintext — caller sends this via Telegram/email, then discards it
  expiresAt: Date
}

/** Creates a new OTP record and returns the plaintext code for delivery. The plaintext never touches the database. */
export async function createOtp(deliveryMethod: 'email' | 'telegram'): Promise<GeneratedOtp> {
  const code = generateCode()
  const codeHash = hashCode(code)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  const row = await queryOne<{ id: string }>(
    `insert into public.otp_codes (code_hash, delivery_method, max_attempts, expires_at)
     values ($1, $2, $3, $4)
     returning id`,
    [codeHash, deliveryMethod, MAX_ATTEMPTS, expiresAt]
  )

  if (!row) throw new Error('Failed to create OTP record')

  query(`delete from public.otp_codes where expires_at < now() - interval '1 day'`).catch(() => {})

  return { id: row.id, code, expiresAt }
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'expired' | 'already_used' | 'too_many_attempts' | 'invalid_code' }

/**
 * Verifies a submitted code against the stored OTP record.
 * Increments the attempt counter on every call (success or failure) so a
 * brute-force loop is bounded by max_attempts regardless of outcome.
 */
export async function verifyOtp(otpId: string, submittedCode: string): Promise<OtpVerifyResult> {
  const record = await queryOne<{
    id: string; code_hash: string; attempts: number; max_attempts: number
    expires_at: string; consumed_at: string | null
  }>(
    `select id, code_hash, attempts, max_attempts, expires_at, consumed_at
     from public.otp_codes where id = $1`,
    [otpId]
  )

  if (!record) return { ok: false, reason: 'not_found' }
  if (record.consumed_at) return { ok: false, reason: 'already_used' }
  if (record.attempts >= record.max_attempts) return { ok: false, reason: 'too_many_attempts' }
  if (new Date(record.expires_at) < new Date()) return { ok: false, reason: 'expired' }

  await query(`update public.otp_codes set attempts = attempts + 1 where id = $1`, [otpId])

  const submittedHash = hashCode(submittedCode)
  if (submittedHash !== record.code_hash) {
    return { ok: false, reason: 'invalid_code' }
  }

  await query(`update public.otp_codes set consumed_at = now() where id = $1`, [otpId])
  return { ok: true }
}
