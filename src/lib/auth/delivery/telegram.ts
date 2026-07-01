// src/lib/auth/delivery/telegram.ts
// Sends the OTP code via Telegram Bot API. Server-only — TELEGRAM_BOT_TOKEN
// must never be exposed to the client. Telegram's Bot API is plain HTTPS,
// no SDK dependency needed.

export async function sendOtpViaTelegram(code: string, expiresInMinutes: number): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_OWNER_CHAT_ID

  if (!botToken || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_OWNER_CHAT_ID is not configured.')
  }

  const message =
    `🔐 *Login Verification Code*\n\n` +
    `Your code: \`${code}\`\n\n` +
    `This code expires in ${expiresInMinutes} minutes.\n` +
    `If you did not request this, you can safely ignore this message — no one can access your account without this code.`

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Telegram delivery failed: ${res.status} ${body}`)
  }
}
