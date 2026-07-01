// src/lib/auth/delivery/email.ts
// Sends the OTP code via Resend. Server-only — RESEND_API_KEY must never be
// exposed to the client.

import { Resend } from 'resend'

function buildOtpEmailHtml(code: string, expiresInMinutes: number): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0D1220; color: #EDF2FF; border-radius: 16px;">
      <div style="font-size: 14px; font-weight: 700; letter-spacing: 0.05em; color: #4F6EF7; text-transform: uppercase; margin-bottom: 24px;">
        Login Verification
      </div>
      <p style="font-size: 15px; line-height: 1.6; color: #7A869A; margin: 0 0 24px;">
        Use the code below to sign in to your admin dashboard. This code is valid for
        <strong style="color: #EDF2FF;">${expiresInMinutes} minutes</strong>.
      </p>
      <div style="background: #111827; border: 1px solid #1A2540; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 0.2em; color: #F0A500; font-family: monospace;">
          ${code}
        </span>
      </div>
      <p style="font-size: 13px; line-height: 1.6; color: #3D4F6B; margin: 0;">
        ⚠️ If you did not request this code, you can safely ignore this email — no one can
        access your account without it. Never share this code with anyone.
      </p>
    </div>
  `
}

export async function sendOtpViaEmail(toEmail: string, code: string, expiresInMinutes: number): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.')
  }

  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: toEmail,
    subject: `Your login code: ${code}`,
    html: buildOtpEmailHtml(code, expiresInMinutes),
  })

  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`)
  }
}
