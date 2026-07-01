// src/components/admin/timeline/TimelineManagerClient.tsx
'use client'

import { useState } from 'react'
import type { TimelineEvent } from '@/types'
import { Btn, Input, Textarea, Label, Toast, AdminCard } from '@/components/admin/shared/ui'
import { DataTable, StatusBadge, type Column } from '@/components/admin/shared/DataTable'

const empty: Partial<TimelineEvent> = {
  year: '', title: '', body: '', category: 'life', is_milestone: false, is_future: false, content_status: 'published',
}

function Form({ item, onSave, onCancel }: { item: Partial<TimelineEvent>; onSave: (e: Partial<TimelineEvent>) => void; onCancel: () => void }) {
  const [form, setForm] = useState(item)
  return (
    <AdminCard className="max-w-[560px]">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Year</Label><Input value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="2024 or Future" /></div>
          <div>
            <Label>Category</Label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-[var(--color-text)]">
              {['life','academic','project','travel','future'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Body</Label><Textarea rows={4} value={form.body ?? ''} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
            <input type="checkbox" checked={form.is_milestone ?? false} onChange={e => setForm({ ...form, is_milestone: e.target.checked })} />
            Milestone
          </label>
          <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
            <input type="checkbox" checked={form.is_future ?? false} onChange={e => setForm({ ...form, is_future: e.target.checked })} />
            Future event
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

export function TimelineManagerClient({ initial }: { initial: TimelineEvent[] }) {
  const [items, setItems] = useState(initial)
  const [editing, setEditing] = useState<Partial<TimelineEvent> | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const save = async (e: Partial<TimelineEvent>) => {
    const isNew = !e.id
    const res = await fetch(isNew ? '/api/admin/timeline' : `/api/admin/timeline/${e.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
    })
    if (!res.ok) { setToast({ msg: 'Failed to save.', type: 'error' }); return }
    const { data } = await res.json()
    setItems(prev => isNew ? [...prev, data] : prev.map(x => x.id === data.id ? data : x))
    setEditing(null)
    setToast({ msg: 'Saved.', type: 'success' })
  }

  const remove = async (e: TimelineEvent) => {
    if (!confirm(`Delete "${e.title}"?`)) return
    const res = await fetch(`/api/admin/timeline/${e.id}`, { method: 'DELETE' })
    if (res.ok) { setItems(prev => prev.filter(x => x.id !== e.id)); setToast({ msg: 'Deleted.', type: 'success' }) }
  }

  const columns: Column<TimelineEvent>[] = [
    { key: 'year', label: 'Year', width: '100px' },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'is_milestone', label: 'Milestone', render: e => e.is_milestone ? '★' : '—' },
    { key: 'content_status', label: 'Status', render: e => <StatusBadge status={e.content_status} /> },
  ]

  if (editing) return <Form item={editing} onSave={save} onCancel={() => setEditing(null)} />

  return (
    <div>
      <div className="flex justify-end mb-5"><Btn onClick={() => setEditing(empty)}>+ Add Event</Btn></div>
      <DataTable columns={columns} rows={items} onEdit={setEditing} onDelete={remove} emptyMessage="No timeline events yet." />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
