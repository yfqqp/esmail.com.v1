// src/components/admin/seo/SEOManagerClient.tsx
'use client'

import { useState } from 'react'
import type { SEOSettings } from '@/types'
import { Btn, Input, Textarea, Label, Toast, AdminCard, FieldTag } from '@/components/admin/shared/ui'

export function SEOManagerClient({ initial }: { initial: SEOSettings[] }) {
  const [pages, setPages] = useState(initial)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const editing = pages.find(p => p.page_key === editingKey)

  const save = async (patch: Partial<SEOSettings> & { page_key: string }) => {
    const res = await fetch('/api/admin/seo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) { setToast({ msg: 'Failed to save.', type: 'error' }); return }
    const { data } = await res.json()
    setPages(prev => prev.map(p => p.page_key === data.page_key ? data : p))
    setEditingKey(null)
    setToast({ msg: 'SEO settings saved.', type: 'success' })
  }

  if (editing) {
    return <SEOForm page={editing} onSave={save} onCancel={() => setEditingKey(null)} />
  }

  return (
    <div className="flex flex-col gap-2.5">
      {pages.map(page => (
        <div key={page.page_key} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[var(--color-text)] text-sm font-medium">{page.page_key}</span>
              {page.no_index && <FieldTag color="gray">no-index</FieldTag>}
            </div>
            <div className="text-dimmer text-xs truncate">{page.title}</div>
          </div>
          <Btn variant="secondary" size="sm" onClick={() => setEditingKey(page.page_key)}>Edit</Btn>
        </div>
      ))}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

function SEOForm({ page, onSave, onCancel }: { page: SEOSettings; onSave: (p: Partial<SEOSettings> & { page_key: string }) => void; onCancel: () => void }) {
  const [form, setForm] = useState(page)
  return (
    <AdminCard className="max-w-[600px]">
      <div className="flex flex-col gap-4">
        <div className="text-muted text-xs">Editing: <span className="text-accent font-mono">{form.page_key}</span></div>
        <div><Label>Meta Title (≤70 chars)</Label><Input value={form.title} maxLength={70} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Meta Description (≤160 chars)</Label><Textarea rows={3} maxLength={160} value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>Open Graph Title</Label><Input value={form.og_title ?? ''} onChange={e => setForm({ ...form, og_title: e.target.value })} /></div>
        <div><Label>Open Graph Description</Label><Textarea rows={2} value={form.og_description ?? ''} onChange={e => setForm({ ...form, og_description: e.target.value })} /></div>
        <div><Label>Open Graph Image URL</Label><Input value={form.og_image_url ?? ''} onChange={e => setForm({ ...form, og_image_url: e.target.value })} placeholder="https://..." /></div>
        <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
          <input type="checkbox" checked={form.no_index} onChange={e => setForm({ ...form, no_index: e.target.checked })} />
          Exclude from search engines (noindex)
        </label>
        <div className="flex gap-2.5 pt-4 border-t border-border">
          <Btn onClick={() => onSave(form)}>Save</Btn>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </AdminCard>
  )
}
