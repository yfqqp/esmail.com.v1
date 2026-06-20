// src/components/admin/quotes/QuotesManagerClient.tsx
'use client'

import { useState } from 'react'
import type { Quote } from '@/types'
import { Btn, Input, Textarea, Label, Toast, AdminCard } from '@/components/admin/shared/ui'
import { DataTable, StatusBadge, type Column } from '@/components/admin/shared/DataTable'

const empty: Partial<Quote> = { text: '', author: 'Ismail Safwan', category: 'general', is_personal: false, is_featured: false, content_status: 'published' }

function Form({ item, onSave, onCancel }: { item: Partial<Quote>; onSave: (q: Partial<Quote>) => void; onCancel: () => void }) {
  const [form, setForm] = useState(item)
  return (
    <AdminCard className="max-w-[560px]">
      <div className="flex flex-col gap-4">
        <div><Label>Quote Text</Label><Textarea rows={3} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} /></div>
        <div><Label>Author</Label><Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} /></div>
        <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
            <input type="checkbox" checked={form.is_personal ?? false} onChange={e => setForm({ ...form, is_personal: e.target.checked })} />
            Ismail&apos;s own words
          </label>
          <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
            <input type="checkbox" checked={form.is_featured ?? false} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
            Featured
          </label>
        </div>
        <div className="flex gap-2.5 mt-2 pt-4 border-t border-border">
          <Btn onClick={() => onSave(form)}>Save</Btn>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </AdminCard>
  )
}

export function QuotesManagerClient({ initial }: { initial: Quote[] }) {
  const [items, setItems] = useState(initial)
  const [editing, setEditing] = useState<Partial<Quote> | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const save = async (q: Partial<Quote>) => {
    const isNew = !q.id
    const res = await fetch(isNew ? '/api/admin/quotes' : `/api/admin/quotes/${q.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q),
    })
    if (!res.ok) { setToast({ msg: 'Failed to save.', type: 'error' }); return }
    const { data } = await res.json()
    setItems(prev => isNew ? [data, ...prev] : prev.map(x => x.id === data.id ? data : x))
    setEditing(null)
    setToast({ msg: 'Saved.', type: 'success' })
  }

  const remove = async (q: Quote) => {
    if (!confirm('Delete this quote?')) return
    const res = await fetch(`/api/admin/quotes/${q.id}`, { method: 'DELETE' })
    if (res.ok) { setItems(prev => prev.filter(x => x.id !== q.id)); setToast({ msg: 'Deleted.', type: 'success' }) }
  }

  const columns: Column<Quote>[] = [
    { key: 'text', label: 'Quote', render: q => <span className="line-clamp-2">{q.text}</span> },
    { key: 'author', label: 'Author' },
    { key: 'is_featured', label: 'Featured', render: q => q.is_featured ? '★' : '—' },
    { key: 'content_status', label: 'Status', render: q => <StatusBadge status={q.content_status} /> },
  ]

  if (editing) return <Form item={editing} onSave={save} onCancel={() => setEditing(null)} />

  return (
    <div>
      <div className="flex justify-end mb-5"><Btn onClick={() => setEditing(empty)}>+ Add Quote</Btn></div>
      <DataTable columns={columns} rows={items} onEdit={setEditing} onDelete={remove} emptyMessage="No quotes yet." />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
