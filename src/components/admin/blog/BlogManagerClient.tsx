// src/components/admin/blog/BlogManagerClient.tsx
'use client'

import { useState } from 'react'
import type { BlogPost } from '@/types'
import { Btn, Input, Textarea, Label, Toast, AdminCard } from '@/components/admin/shared/ui'
import { DataTable, StatusBadge, type Column } from '@/components/admin/shared/DataTable'

const empty: Partial<BlogPost> = {
  title: '', excerpt: '', content: '', category: 'thoughts', tags: [], content_status: 'draft', is_featured: false,
}

function Form({ post, onSave, onCancel }: { post: Partial<BlogPost>; onSave: (p: Partial<BlogPost>) => void; onCancel: () => void }) {
  const [form, setForm] = useState(post)
  return (
    <AdminCard className="max-w-[680px]">
      <div className="flex flex-col gap-4">
        <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Excerpt</Label><Textarea rows={2} value={form.excerpt ?? ''} onChange={e => setForm({ ...form, excerpt: e.target.value })} /></div>
        <div><Label>Content (Markdown)</Label><Textarea rows={10} value={form.content ?? ''} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
          <div><Label>Tags (comma separated)</Label><Input value={(form.tags ?? []).join(', ')} onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
            <input type="checkbox" checked={form.is_featured ?? false} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
            Featured
          </label>
          <div className="flex items-center gap-2">
            <Label>Publish</Label>
            <select value={form.content_status} onChange={e => setForm({ ...form, content_status: e.target.value as BlogPost['content_status'] })} className="bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-[var(--color-text)]">
              {['draft','published','archived'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2.5 mt-2 pt-4 border-t border-border">
          <Btn onClick={() => onSave(form)}>Save Post</Btn>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </AdminCard>
  )
}

export function BlogManagerClient({ initial }: { initial: BlogPost[] }) {
  const [posts, setPosts] = useState(initial)
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const save = async (p: Partial<BlogPost>) => {
    const isNew = !p.id
    const res = await fetch(isNew ? '/api/admin/blog' : `/api/admin/blog/${p.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    if (!res.ok) { setToast({ msg: 'Failed to save.', type: 'error' }); return }
    const { data } = await res.json()
    setPosts(prev => isNew ? [data, ...prev] : prev.map(x => x.id === data.id ? data : x))
    setEditing(null)
    setToast({ msg: 'Saved.', type: 'success' })
  }

  const remove = async (p: BlogPost) => {
    if (!confirm(`Delete "${p.title}"?`)) return
    const res = await fetch(`/api/admin/blog/${p.id}`, { method: 'DELETE' })
    if (res.ok) { setPosts(prev => prev.filter(x => x.id !== p.id)); setToast({ msg: 'Deleted.', type: 'success' }) }
  }

  const columns: Column<BlogPost>[] = [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'content_status', label: 'Status', render: p => <StatusBadge status={p.content_status} /> },
    { key: 'is_featured', label: 'Featured', render: p => p.is_featured ? '★' : '—' },
    { key: 'view_count', label: 'Views' },
  ]

  if (editing) return <Form post={editing} onSave={save} onCancel={() => setEditing(null)} />

  return (
    <div>
      <div className="flex justify-end mb-5"><Btn onClick={() => setEditing(empty)}>+ New Post</Btn></div>
      <DataTable columns={columns} rows={posts} onEdit={setEditing} onDelete={remove} emptyMessage="No blog posts yet." />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
