// src/components/admin/projects/ProjectsManagerClient.tsx
'use client'

import { useState } from 'react'
import type { Project } from '@/types'
import { Btn, Input, Textarea, Label, Toast, AdminCard } from '@/components/admin/shared/ui'
import { DataTable, StatusBadge, type Column } from '@/components/admin/shared/DataTable'

const emptyProject: Partial<Project> = {
  title: '', summary: '', body: '', category: 'General', tags: [], tech_stack: [],
  status: 'planned', content_status: 'draft', repo_url: '', demo_url: '', is_featured: false,
}

function ProjectForm({
  project, onSave, onCancel,
}: {
  project: Partial<Project>
  onSave: (p: Partial<Project>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(project)

  return (
    <AdminCard className="max-w-[640px]">
      <div className="flex flex-col gap-4">
        <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Summary</Label><Textarea rows={2} value={form.summary ?? ''} onChange={e => setForm({ ...form, summary: e.target.value })} /></div>
        <div><Label>Full Description (Markdown)</Label><Textarea rows={6} value={form.body ?? ''} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
          <div>
            <Label>Status</Label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Project['status'] })} className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-[var(--color-text)]">
              {['planned','active','completed','on_hold','archived'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div><Label>Tech Stack (comma separated)</Label><Input value={(form.tech_stack ?? []).join(', ')} onChange={e => setForm({ ...form, tech_stack: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Repository URL</Label><Input value={form.repo_url ?? ''} onChange={e => setForm({ ...form, repo_url: e.target.value })} placeholder="https://github.com/..." /></div>
          <div><Label>Demo URL</Label><Input value={form.demo_url ?? ''} onChange={e => setForm({ ...form, demo_url: e.target.value })} placeholder="https://..." /></div>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer">
            <input type="checkbox" checked={form.is_featured ?? false} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
            Featured
          </label>
          <div className="flex items-center gap-2">
            <Label>Publish</Label>
            <select value={form.content_status} onChange={e => setForm({ ...form, content_status: e.target.value as Project['content_status'] })} className="bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-[var(--color-text)]">
              {['draft','published','archived'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2.5 mt-2 pt-4 border-t border-border">
          <Btn onClick={() => onSave(form)}>Save Project</Btn>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </AdminCard>
  )
}

export function ProjectsManagerClient({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [editing, setEditing] = useState<Partial<Project> | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const save = async (p: Partial<Project>) => {
    const isNew = !p.id
    const res = await fetch(isNew ? '/api/admin/projects' : `/api/admin/projects/${p.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    if (!res.ok) { setToast({ msg: 'Failed to save project.', type: 'error' }); return }
    const { data } = await res.json()
    setProjects(prev => isNew ? [data, ...prev] : prev.map(x => x.id === data.id ? data : x))
    setEditing(null)
    setToast({ msg: 'Project saved.', type: 'success' })
  }

  const remove = async (p: Project) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/projects/${p.id}`, { method: 'DELETE' })
    if (res.ok) {
      setProjects(prev => prev.filter(x => x.id !== p.id))
      setToast({ msg: 'Project deleted.', type: 'success' })
    }
  }

  const columns: Column<Project>[] = [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status', render: p => <StatusBadge status={p.status} /> },
    { key: 'content_status', label: 'Visibility', render: p => <StatusBadge status={p.content_status} /> },
    { key: 'is_featured', label: 'Featured', render: p => p.is_featured ? '★' : '—' },
  ]

  if (editing) {
    return <ProjectForm project={editing} onSave={save} onCancel={() => setEditing(null)} />
  }

  return (
    <div>
      <div className="flex justify-end mb-5">
        <Btn onClick={() => setEditing(emptyProject)}>+ Add Project</Btn>
      </div>
      <DataTable columns={columns} rows={projects} onEdit={setEditing} onDelete={remove} emptyMessage="No projects yet. Add your first one." />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
