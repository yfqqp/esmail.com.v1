// src/lib/ai/chat.ts
// AI assistant service layer. Designed for progressive activation:
// Phase 1 (current): static knowledge from seeded entries, no embeddings
// Phase 2: embed new entries, cosine similarity retrieval (pgvector)
// Phase 3: streaming responses, conversation memory
//
// Activation checklist:
//   1. Set OPENAI_API_KEY in environment
//   2. Enable pgvector in Supabase dashboard
//   3. Run embedding backfill: POST /api/ai/knowledge/embed-all (admin)
//   4. Set site_setting 'ai_enabled' = true in admin panel

import { createServiceClient } from '@/lib/supabase/server'
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
async function retrieveRelevantContext(query: string, limit = 4): Promise<string> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) return ''

    // Generate query embedding
    const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: query, model: 'text-embedding-3-small' }),
    })
    const embedData = await embedRes.json()
    const queryVector: number[] = embedData.data?.[0]?.embedding
    if (!queryVector) return ''

    // Cosine similarity search via service client (bypasses RLS on chunks)
    const supabase = createServiceClient()
    const { data: chunks } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryVector,
      similarity_threshold: 0.72,
      match_count: limit,
    } as any)

    if (!chunks?.length) return ''
    return (chunks as Array<{ content: string }>)
      .map((c, i) => `[Context ${i + 1}]: ${c.content}`)
      .join('\n\n')
  } catch {
    return '' // silently degrade to base prompt
  }
}

/** Get active knowledge entries as plain text (Phase 1 fallback) */
async function getStaticKnowledgeContext(): Promise<string> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('ai_knowledge_entries')
      .select('title, raw_content')
      .eq('is_active', true)
      .eq('processing_status', 'embedded')
      .order('created_at')
      .limit(10)

    if (!data?.length) return ''
    return (data as Array<{ title: string; raw_content: string | null }>)
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

  // Try vector retrieval first; fall back to static embedded entries
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

  const supabase = createServiceClient()

  // Fetch the entry
  const { data: entry, error } = await supabase
    .from('ai_knowledge_entries').select('*').eq('id', entryId).single()
  if (error || !entry) throw new Error(`Entry not found: ${entryId}`)

  const { raw_content } = entry as AIKnowledgeEntry & { raw_content: string }
  if (!raw_content) throw new Error('Entry has no raw_content to embed')

  // Mark as processing
  await supabase.from('ai_knowledge_entries')
    .update({ processing_status: 'processing' }).eq('id', entryId)

  try {
    const chunks = chunkText(raw_content)

    // Delete existing chunks
    await supabase.from('ai_knowledge_chunks').delete().eq('entry_id', entryId)

    // Embed in batches of 20
    const batchSize = 20
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: batch, model: 'text-embedding-3-small' }),
      })
      const embedData = await embedRes.json()

      const rows = batch.map((content, j) => ({
        entry_id: entryId,
        chunk_index: i + j,
        content,
        embedding_raw: embedData.data?.[j]?.embedding ?? null,
        token_count: Math.ceil(content.length / 4),
      }))

      await supabase.from('ai_knowledge_chunks').insert(rows as any)
    }

    // Mark as embedded
    await supabase.from('ai_knowledge_entries').update({
      processing_status: 'embedded',
      chunk_count: chunks.length,
      embedding_model: 'text-embedding-3-small',
    }).eq('id', entryId)

  } catch (err) {
    await supabase.from('ai_knowledge_entries')
      .update({ processing_status: 'failed' }).eq('id', entryId)
    throw err
  }
}
