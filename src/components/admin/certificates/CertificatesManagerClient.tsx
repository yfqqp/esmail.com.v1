// src/components/admin/certificates/CertificatesManagerClient.tsx
'use client'

import { useState } from 'react'
import type { Achievement } from '@/types'
import { Btn, Input, Textarea, Label, Toast, AdminCard } from '@/components/admin/shared/ui'
import { DataTable, StatusBadge, type Column } from '@/components/admin/shared/DataTable'

const empty: Partial<Achievement> = {
  kind: 'certificate', title: '', issuer: '', description: '', rank_or_result: '',
  awarded_on: '', is_featured: false, content_status: 'published',
}

function Form({ item, onSave, onCancel }: { item: Partial<Achievement>; onSave: (a: Partial<Achievement>) => void; onCancel: () => void }) {
  const [form, setForm] = useState(item)
  return (
    <AdminCard className="max-w-[560px]">
      <div className="flex flex-col gap-4">
        <div>
          <Label>Type</Label>
          <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as Achievement['kind'] })} className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-[var(--color-text)]">
            {['certificate','scholarship','competition','award'].map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Issuer</Label><Input value={form.issuer ?? ''} onChange={e => setForm({ ...form, issuer: e.target.value })} /></div>
        <div><Label>Result / Rank</Label><Input value={form.rank_or_result ?? ''} onChange={e => setForm({ ...form, rank_or_result: e.target.value })} placeholder="e.g. 98.7%, 1st Place" /></div>
        <div><Label>Description</Label><Textarea rows={3} value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>Date Awarded</Label><Input type="date" value={form.awarded_on ?? ''} onChange={e => setForm({ ...form, awarded_on: e.target.value })} /></div>
        <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
          <input type="checkbox" checked={form.is_featured ?? false} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
          Featured
        </label>
        <div className="flex gap-2.5 mt-2 pt-4 border-t border-border">
          <Btn onClick={() => onSave(form)}>Save</Btn>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </AdminCard>
  )
}

export function CertificatesManagerClient({ initial }: { initial: Achievement[] }) {
  const [items, setItems] = useState(initial)
  const [editing, setEditing] = useState<Partial<Achievement> | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const save = async (a: Partial<Achievement>) => {
    const isNew = !a.id
    const res = await fetch(isNew ? '/api/admin/achievements' : `/api/admin/achievements/${a.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(a),
    })
    if (!res.ok) { setToast({ msg: 'Failed to save.', type: 'error' }); return }
    const { data } = await res.json()
    setItems(prev => isNew ? [data, ...prev] : prev.map(x => x.id === data.id ? data : x))
    setEditing(null)
    setToast({ msg: 'Saved.', type: 'success' })
  }

  const remove = async (a: Achievement) => {
    if (!confirm(`Delete "${a.title}"?`)) return
    const res = await fetch(`/api/admin/achievements/${a.id}`, { method: 'DELETE' })
    if (res.ok) { setItems(prev => prev.filter(x => x.id !== a.id)); setToast({ msg: 'Deleted.', type: 'success' }) }
  }

  const columns: Column<Achievement>[] = [
    { key: 'kind', label: 'Type' },
    { key: 'title', label: 'Title' },
    { key: 'issuer', label: 'Issuer' },
    { key: 'rank_or_result', label: 'Result' },
    { key: 'content_status', label: 'Status', render: a => <StatusBadge status={a.content_status} /> },
  ]

  if (editing) return <Form item={editing} onSave={save} onCancel={() => setEditing(null)} />

  return (
    <div>
      <div className="flex justify-end mb-5"><Btn onClick={() => setEditing(empty)}>+ Add Achievement</Btn></div>
      <DataTable columns={columns} rows={items} onEdit={setEditing} onDelete={remove} emptyMessage="No certificates or achievements yet." />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
