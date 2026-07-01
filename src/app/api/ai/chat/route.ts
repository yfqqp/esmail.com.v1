// src/app/api/ai/chat/route.ts
// Public endpoint (no auth required — this is the visitor-facing AI widget).
// Rate-limited implicitly by the model cost; consider adding an IP-based
// rate limiter (e.g. Upstash) before scaling traffic significantly.

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { generateChatResponse } from '@/lib/ai/chat'
import { trackEvent } from '@/services'
import { checkRateLimit, getClientIdentifier } from '@/lib/utils/rate-limit'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
})

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
})

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req)
  const rateLimit = checkRateLimit(`ai-chat:${clientId}`, 20, 10 * 60 * 1000) // 20 requests / 10 min

  if (!rateLimit.allowed) {
    return Response.json(
      { success: false, error: 'Too many requests. Please wait a few minutes before trying again.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString() } }
    )
  }

  try {
    const body = bodySchema.parse(await req.json())

    const reply = await generateChatResponse(body.messages)

    // Fire-and-forget analytics (non-blocking, swallow errors)
    trackEvent({
      event_type: 'ai_chat_message',
      page_path: '/ai-assistant',
      metadata: { message_count: body.messages.length },
    }).catch(() => {})

    return Response.json({ success: true, data: { reply } })
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('AI_NOT_CONFIGURED')) {
      return Response.json(
        { success: false, error: 'The AI assistant is not yet configured. Set OPENAI_API_KEY to activate it.', code: 'AI_NOT_CONFIGURED' },
        { status: 503 }
      )
    }
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
