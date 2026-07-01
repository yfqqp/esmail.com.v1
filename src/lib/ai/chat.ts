// src/lib/ai/chat.ts
// AI assistant service layer. Designed for progressive activation:
// Phase 1 (current): static knowledge from seeded entries, no embeddings
// Phase 2: embed new entries, cosine similarity retrieval (pgvector)
// Phase 3: streaming responses, conversation memory
//
// Activation checklist:
//   1. Set OPENAI_API_KEY in environment
//   2. Enable pgvector in your Postgres database
//   3. Embed entries from /admin/ai-knowledge
//   4. Set site_setting 'ai_enabled' = true in admin panel
//
// This module does not crash or throw at import time if OPENAI_API_KEY is
// missing — generateChatResponse() throws a typed AI_NOT_CONFIGURED error
// only when actually invoked, which the API route translates into a
// graceful "setup required" response instead of a 500.

import { query, queryOne } from '@/lib/db/pool'
import type { AIKnowledgeEntry } from '@/types'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatOptions {
  model?: string
  maxTokens?: number
  temperature?: number
}

const BASE_SYSTEM_PROMPT = `You are the AI representative of Ismail Safwan — a robotics and AI engineering student (born 2006) with a 98.7% GPA equivalent and a 95/100 Qudurat score. INTJ personality. Passionate about robotics, mechatronics, AI, and languages. Plans to study at MIT, ETH Zurich, or Stanford. Speaks Arabic natively and English fluently.

Answer as his knowledgeable digital representative: precise, strategic, no fluff. Keep answers to 2–4 sentences unless more depth is clearly needed. Never invent facts not in the context. If asked about something not covered, say "Ismail hasn't shared that with me yet, but knowing him, it would be thoughtfully considered."`

/** Retrieve relevant knowledge chunks for a user query (Phase 2+, requires pgvector) */
async function retrieveRelevantContext(userQuery: string, limit = 4): Promise<string> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) return ''

    const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: userQuery, model: 'text-embedding-3-small' }),
    })
    const embedData = await embedRes.json()
    const queryVector: number[] = embedData.data?.[0]?.embedding
    if (!queryVector) return ''

    // Requires the match_knowledge_chunks() SQL function (see migration 009,
    // currently commented out pending pgvector activation).
    const chunks = await query<{ content: string }>(
      `select content from public.match_knowledge_chunks($1, $2, $3)`,
      [JSON.stringify(queryVector), 0.72, limit]
    ).catch(() => [])

    if (!chunks.length) return ''
    return chunks.map((c, i) => `[Context ${i + 1}]: ${c.content}`).join('\n\n')
  } catch {
    return '' // silently degrade to base prompt
  }
}

/** Get active knowledge entries as plain text (Phase 1 fallback) */
async function getStaticKnowledgeContext(): Promise<string> {
  try {
    const rows = await query<{ title: string; raw_content: string | null }>(
      `select title, raw_content from public.ai_knowledge_entries
       where is_active = true and processing_status = 'embedded'
       order by created_at limit 10`
    )
    if (!rows.length) return ''
    return rows
      .filter(e => e.raw_content)
      .map(e => `### ${e.title}\n${e.raw_content}`)
      .join('\n\n')
  } catch {
    return ''
  }
}

/** Main chat function. Called by POST /api/ai/chat */
export async function generateChatResponse(
  messages: ChatMessage[],
  opts: ChatOptions = {}
): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    throw new Error('AI_NOT_CONFIGURED: Set OPENAI_API_KEY to enable the AI assistant.')
  }

  const userMessage = messages[messages.length - 1]?.content ?? ''

  let context = await retrieveRelevantContext(userMessage)
  if (!context) context = await getStaticKnowledgeContext()

  const systemPrompt = context
    ? `${BASE_SYSTEM_PROMPT}\n\n## Knowledge Context\n${context}`
    : BASE_SYSTEM_PROMPT

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model ?? 'gpt-4o-mini',
      max_tokens: opts.maxTokens ?? 500,
      temperature: opts.temperature ?? 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`OpenAI API error: ${(err as any).error?.message ?? response.statusText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? 'I could not generate a response.'
}

/** Chunk a text document into overlapping paragraphs for embedding */
export function chunkText(text: string, chunkSize = 400, overlap = 80): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
    i += chunkSize - overlap
  }
  return chunks.filter(c => c.trim().length > 50)
}

/** Embed and store all chunks for a knowledge entry (called by admin pipeline) */
export async function embedKnowledgeEntry(entryId: string): Promise<void> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) throw new Error('OPENAI_API_KEY not set')

  const entry = await queryOne<AIKnowledgeEntry>(
    `select * from public.ai_knowledge_entries where id = $1`,
    [entryId]
  )
  if (!entry) throw new Error(`Entry not found: ${entryId}`)
  if (!entry.raw_content) throw new Error('Entry has no raw_content to embed')

  await query(`update public.ai_knowledge_entries set processing_status = 'processing' where id = $1`, [entryId])

  try {
    const chunks = chunkText(entry.raw_content)

    await query(`delete from public.ai_knowledge_chunks where entry_id = $1`, [entryId])

    const batchSize = 20
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: batch, model: 'text-embedding-3-small' }),
      })
      const embedData = await embedRes.json()

      for (let j = 0; j < batch.length; j++) {
        const embedding = embedData.data?.[j]?.embedding ?? null
        await query(
          `insert into public.ai_knowledge_chunks (entry_id, chunk_index, content, embedding_raw, token_count)
           values ($1, $2, $3, $4, $5)`,
          [entryId, i + j, batch[j], embedding, Math.ceil(batch[j].length / 4)]
        )
      }
    }

    await query(
      `update public.ai_knowledge_entries
       set processing_status = 'embedded', chunk_count = $1, embedding_model = 'text-embedding-3-small'
       where id = $2`,
      [chunks.length, entryId]
    )
  } catch (err) {
    await query(`update public.ai_knowledge_entries set processing_status = 'failed' where id = $1`, [entryId])
    throw err
  }
}
