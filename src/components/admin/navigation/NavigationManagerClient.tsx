// src/components/admin/navigation/NavigationManagerClient.tsx
'use client'

import { useState } from 'react'
import type { NavigationItem } from '@/types'
import { Btn, Input, Label, Toast, AdminCard, FieldTag } from '@/components/admin/shared/ui'

const empty: Partial<NavigationItem> = { label: '', item_type: 'section_anchor', target: '', is_visible: true, open_new_tab: false }

function Form({ item, onSave, onCancel }: { item: Partial<NavigationItem>; onSave: (n: Partial<NavigationItem>) => void; onCancel: () => void }) {
  const [form, setForm] = useState(item)
  return (
    <AdminCard className="max-w-[480px] mb-5">
      <div className="flex flex-col gap-4">
        <div><Label>Label</Label><Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
        <div>
          <Label>Type</Label>
          <select value={form.item_type} onChange={e => setForm({ ...form, item_type: e.target.value as NavigationItem['item_type'] })} className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-[var(--color-text)]">
            <option value="section_anchor">Section anchor (#id on homepage)</option>
            <option value="internal_page">Internal page (/path)</option>
            <option value="external_url">External URL</option>
          </select>
        </div>
        <div><Label>Target</Label><Input value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder="story / /gallery / https://..." /></div>
        <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
          <input type="checkbox" checked={form.open_new_tab ?? false} onChange={e => setForm({ ...form, open_new_tab: e.target.checked })} />
          Open in new tab
        </label>
        <div className="flex gap-2.5 pt-3 border-t border-border">
          <Btn onClick={() => onSave(form)}>Save</Btn>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </AdminCard>
  )
}

export function NavigationManagerClient({ initial }: { initial: NavigationItem[] }) {
  const [items, setItems] = useState(initial)
  const [editing, setEditing] = useState<Partial<NavigationItem> | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const save = async (n: Partial<NavigationItem>) => {
    const isNew = !n.id
    const res = await fetch(isNew ? '/api/admin/navigation' : `/api/admin/navigation/${n.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n),
    })
    if (!res.ok) { setToast({ msg: 'Failed to save.', type: 'error' }); return }
    const { data } = await res.json()
    setItems(prev => isNew ? [...prev, data] : prev.map(x => x.id === data.id ? data : x))
    setEditing(null)
    setToast({ msg: 'Saved.', type: 'success' })
  }

  const toggleVisible = async (n: NavigationItem) => {
    setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_visible: !x.is_visible } : x))
    await fetch(`/api/admin/navigation/${n.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: !n.is_visible }),
    })
  }

  const remove = async (n: NavigationItem) => {
    if (!confirm(`Delete "${n.label}"?`)) return
    const res = await fetch(`/api/admin/navigation/${n.id}`, { method: 'DELETE' })
    if (res.ok) { setItems(prev => prev.filter(x => x.id !== n.id)); setToast({ msg: 'Deleted.', type: 'success' }) }
  }

  return (
    <div>
      {editing ? (
        <Form item={editing} onSave={save} onCancel={() => setEditing(null)} />
      ) : (
        <div className="flex justify-end mb-5"><Btn onClick={() => setEditing(empty)}>+ Add Nav Item</Btn></div>
      )}

      <div className="flex flex-col gap-2">
        {items.map(item => (
          <div key={item.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3" style={{ opacity: item.is_visible ? 1 : 0.5 }}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-text)] text-sm font-medium">{item.label}</span>
                <FieldTag color="gray">{item.item_type}</FieldTag>
              </div>
              <div className="text-dimmer text-xs mt-0.5">{item.target}</div>
            </div>
            <div className="flex gap-2">
              <Btn variant="secondary" size="sm" onClick={() => setEditing(item)}>Edit</Btn>
              <Btn variant={item.is_visible ? 'success' : 'ghost'} size="sm" onClick={() => toggleVisible(item)}>
                {item.is_visible ? 'Visible' : 'Hidden'}
              </Btn>
              <Btn variant="danger" size="sm" onClick={() => remove(item)}>Delete</Btn>
            </div>
          </div>
        ))}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
