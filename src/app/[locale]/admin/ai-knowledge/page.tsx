// src/app/[locale]/admin/ai-knowledge/page.tsx
import { adminGetAIEntries } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { AIKnowledgeClient } from '@/components/admin/ai-knowledge/AIKnowledgeClient'

export default async function AdminAIKnowledgePage() {
  const entries = await adminGetAIEntries()
  return (
    <div>
      <PageHeader title="AI Knowledge Base" description="Facts and context the AI Assistant draws on when answering visitors" />
      <AIKnowledgeClient initial={entries} />
    </div>
  )
}
