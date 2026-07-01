// src/components/admin/ai-knowledge/AIKnowledgeClient.tsx
'use client'

import { useState } from 'react'
import type { AIKnowledgeEntry } from '@/types'
import { Btn, Input, Textarea, Label, Toast, AdminCard, FieldTag } from '@/components/admin/shared/ui'

const STATUS_COLOR: Record<string, 'green' | 'amber' | 'gray'> = {
  embedded: 'green', pending: 'amber', processing: 'amber', failed: 'gray',
}

const empty: Partial<AIKnowledgeEntry> = { title: '', source_type: 'manual_note', raw_content: '', tags: [], is_active: true }

function Form({ entry, onSave, onCancel }: { entry: Partial<AIKnowledgeEntry>; onSave: (e: Partial<AIKnowledgeEntry>) => void; onCancel: () => void }) {
  const [form, setForm] = useState(entry)
  return (
    <AdminCard className="max-w-[680px]">
      <div className="flex flex-col gap-4">
        <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Content</Label><Textarea rows={10} value={form.raw_content ?? ''} onChange={e => setForm({ ...form, raw_content: e.target.value })} placeholder="Facts, context, or knowledge the AI assistant should know." /></div>
        <div><Label>Tags (comma separated)</Label><Input value={(form.tags ?? []).join(', ')} onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
        <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
          <input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
          Active (included in AI context)
        </label>
        <div className="flex gap-2.5 mt-2 pt-4 border-t border-border">
          <Btn onClick={() => onSave(form)}>Save Entry</Btn>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </AdminCard>
  )
}

export function AIKnowledgeClient({ initial }: { initial: AIKnowledgeEntry[] }) {
  const [entries, setEntries] = useState(initial)
  const [editing, setEditing] = useState<Partial<AIKnowledgeEntry> | null>(null)
  const [embeddingId, setEmbeddingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const save = async (e: Partial<AIKnowledgeEntry>) => {
    const isNew = !e.id
    const res = await fetch(isNew ? '/api/admin/ai-knowledge' : `/api/admin/ai-knowledge/${e.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
    })
    if (!res.ok) { setToast({ msg: 'Failed to save.', type: 'error' }); return }
    const { data } = await res.json()
    setEntries(prev => isNew ? [data, ...prev] : prev.map(x => x.id === data.id ? data : x))
    setEditing(null)
    setToast({ msg: 'Saved. Click "Embed" to make it searchable by the AI.', type: 'success' })
  }

  const remove = async (e: AIKnowledgeEntry) => {
    if (!confirm(`Delete "${e.title}"?`)) return
    const res = await fetch(`/api/admin/ai-knowledge/${e.id}`, { method: 'DELETE' })
    if (res.ok) { setEntries(prev => prev.filter(x => x.id !== e.id)); setToast({ msg: 'Deleted.', type: 'success' }) }
  }

  const embed = async (e: AIKnowledgeEntry) => {
    setEmbeddingId(e.id)
    const res = await fetch(`/api/admin/ai-knowledge/${e.id}`, { method: 'POST' })
    if (res.ok) {
      setEntries(prev => prev.map(x => x.id === e.id ? { ...x, processing_status: 'embedded' } : x))
      setToast({ msg: 'Entry embedded successfully.', type: 'success' })
    } else {
      const { error } = await res.json()
      setToast({ msg: error ?? 'Embedding failed. Check OPENAI_API_KEY is set.', type: 'error' })
    }
    setEmbeddingId(null)
  }

  if (editing) return <Form entry={editing} onSave={save} onCancel={() => setEditing(null)} />

  return (
    <div>
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-lg">ℹ️</span>
        <div className="text-[13px] text-muted leading-relaxed">
          Knowledge entries power the AI Assistant. Add facts, stories, or context about yourself here.
          Click <strong className="text-[var(--color-text)]">Embed</strong> after saving to make an entry searchable.
          Activation requires <code className="bg-surface px-1.5 py-0.5 rounded text-accent">OPENAI_API_KEY</code> to be set in your environment.
        </div>
      </div>

      <div className="flex justify-end mb-5"><Btn onClick={() => setEditing(empty)}>+ Add Knowledge Entry</Btn></div>

      {entries.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No knowledge entries yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.map(e => (
            <div key={e.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[var(--color-text)] text-sm font-medium">{e.title}</span>
                  <FieldTag color={STATUS_COLOR[e.processing_status] ?? 'gray'}>{e.processing_status}</FieldTag>
                  {!e.is_active && <FieldTag color="gray">inactive</FieldTag>}
                </div>
                <div className="text-dimmer text-xs truncate">{e.raw_content?.slice(0, 120)}...</div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {e.processing_status !== 'embedded' && (
                  <Btn variant="success" size="sm" onClick={() => embed(e)} disabled={embeddingId === e.id}>
                    {embeddingId === e.id ? 'Embedding…' : 'Embed'}
                  </Btn>
                )}
                <Btn variant="secondary" size="sm" onClick={() => setEditing(e)}>Edit</Btn>
                <Btn variant="danger" size="sm" onClick={() => remove(e)}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
