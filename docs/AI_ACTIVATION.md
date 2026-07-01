# AI Assistant Activation Guide

The AI Assistant block is fully built but **inert by default** — it shows a friendly "setup required" state until you provide an OpenAI key. This was a deliberate launch decision: the platform should never ship a broken or half-working AI experience.

## Architecture recap

- `ai_knowledge_entries` — source documents/notes you write or upload (the "what the AI knows")
- `ai_knowledge_chunks` — paragraph-level slices of each entry, each with a stored embedding vector
- `src/lib/ai/chat.ts` — retrieval + generation logic
- `src/app/api/ai/chat/route.ts` — the public endpoint the chat widget calls
- `/admin/ai-knowledge` — where you manage entries and trigger embedding

## Phase 1: Static context (zero extra setup beyond an API key)

1. Set `OPENAI_API_KEY` in your environment and redeploy.
2. The chat route's `getStaticKnowledgeContext()` fallback pulls all `is_active = true` and `processing_status = 'embedded'` entries and stuffs their raw text directly into the system prompt.
3. The three seeded entries (Core Profile, Philosophy, Projects) are already marked `embedded` from the migration seed, so the AI works immediately with zero admin action — it just won't yet reflect anything you write after launch until you mark new entries `embedded`.

This phase has no real vector search — it's a context-stuffing approach that works fine up to roughly 15-20 entries before you'd want true retrieval.

## Phase 2: Real retrieval (pgvector)

1. In Supabase dashboard → Database → Extensions, enable `vector`.
2. Run this migration to convert the embedding column:
   ```sql
   alter table public.ai_knowledge_chunks
     alter column embedding_raw type vector(1536) using embedding_raw::vector(1536);
   alter table public.ai_knowledge_chunks rename column embedding_raw to embedding;
   ```
3. Uncomment the `match_knowledge_chunks` SQL function at the bottom of `database/migrations/009_ai_knowledge_base.sql` and run it.
4. Uncomment the vector-search branch in `src/lib/ai/chat.ts` (`retrieveRelevantContext`) — it already calls `match_knowledge_chunks` via RPC, just needs the function to exist.
5. Re-embed all entries via `/admin/ai-knowledge` → click **Embed** on each one (or build a "re-embed all" admin action calling `embedKnowledgeEntry` in a loop).

From this point, the assistant performs real cosine-similarity retrieval against your knowledge base instead of stuffing everything into the prompt — scales to hundreds of entries.

## Writing good knowledge entries

- One entry per topic (e.g. "Robotics Projects", "Academic Background", "Personality & Values") rather than one giant entry — this keeps chunks coherent.
- Write in third person, factual tone — the system prompt already instructs the model to speak *as* Ismail's representative; entries should read like a knowledge base, not a script.
- Keep entries under ~2000 words each; longer documents chunk fine but are easier to manage in smaller pieces.

## Cost control

- Chat uses `gpt-4o-mini` by default (`src/lib/ai/chat.ts`, `generateChatResponse`) — cheap and fast, suitable for a personal-site assistant.
- Embeddings use `text-embedding-3-small` — also the cheap tier.
- Both model choices are single constants, trivial to upgrade later if you want a more capable model.
