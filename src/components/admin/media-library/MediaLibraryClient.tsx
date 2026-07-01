// src/components/admin/media-library/MediaLibraryClient.tsx
'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import type { MediaItem } from '@/types'
import { Btn, Input, Toast } from '@/components/admin/shared/ui'

export function MediaLibraryClient({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'general')
      formData.append('altText', file.name)

      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error()
        const { data } = await res.json()
        setItems(prev => [data, ...prev])
      } catch {
        setToast({ msg: `Failed to upload ${file.name}`, type: 'error' })
      }
    }
    setUploading(false)
    setToast({ msg: 'Upload complete.', type: 'success' })
  }

  const remove = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.title}"? This removes the file permanently.`)) return
    const res = await fetch(`/api/admin/media/${item.id}`, { method: 'DELETE' })
    if (res.ok) { setItems(prev => prev.filter(x => x.id !== item.id)); setToast({ msg: 'Deleted.', type: 'success' }) }
  }

  const filtered = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex justify-between items-center gap-4 mb-6">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search media…" className="max-w-[280px]" />
        <div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            className="hidden"
            onChange={e => handleUpload(e.target.files)}
          />
          <Btn onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : '+ Upload Files'}
          </Btn>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center">
          <p className="text-muted text-sm mb-2">No media uploaded yet.</p>
          <p className="text-dimmer text-xs">Images, videos, and documents will appear here once uploaded.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="group relative bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-square relative bg-surface">
                {item.kind === 'image' ? (
                  <Image src={item.secure_url} alt={item.alt_text ?? item.title} fill className="object-cover" sizes="200px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {item.kind === 'video' ? '🎬' : item.kind === 'document' ? '📄' : '📁'}
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="text-[11px] text-[var(--color-text)] truncate">{item.title}</div>
                <div className="text-[10px] text-dimmer">{item.format?.toUpperCase()} · {((item.bytes ?? 0) / 1024).toFixed(0)}KB</div>
              </div>
              <button
                onClick={() => remove(item)}
                className="absolute top-1.5 right-1.5 bg-black/70 text-white text-xs w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
