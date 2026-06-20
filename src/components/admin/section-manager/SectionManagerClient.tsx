// src/components/admin/section-manager/SectionManagerClient.tsx
'use client'

import { useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Section } from '@/types'
import { Btn, Input, FieldTag, Toast } from '@/components/admin/shared/ui'
import { SECTION_TYPE_META } from '@/components/blocks/registry'
import { SectionEditorPanel } from './SectionEditorPanel'

function SortableRow({
  section, onToggle, onRename, onEdit,
}: {
  section: Section
  onToggle: (id: string) => void
  onRename: (id: string, label: string) => void
  onEdit: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const [renaming, setRenaming] = useState(false)
  const [nameVal, setNameVal] = useState(section.label)
  const meta = SECTION_TYPE_META[section.section_type]

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: section.is_visible ? 1 : 0.5,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 mb-2"
    >
      <div {...attributes} {...listeners} className="text-dimmer cursor-grab select-none px-1">⠿⠿</div>
      <span className="text-lg flex-shrink-0">{meta?.icon ?? '📄'}</span>
      <div className="flex-1 min-w-0">
        {renaming ? (
          <input
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={() => { onRename(section.id, nameVal); setRenaming(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { onRename(section.id, nameVal); setRenaming(false) } }}
            autoFocus
            className="bg-surface border border-accent rounded-md px-2 py-1 text-[13px] text-[var(--color-text)] w-40"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text)] text-sm font-medium">{section.label}</span>
            <FieldTag color="gray">{section.section_type}</FieldTag>
          </div>
        )}
      </div>
      <div className="flex gap-1.5 items-center flex-shrink-0">
        <button onClick={() => setRenaming(true)} className="bg-transparent border-0 text-muted text-sm px-2 py-1 rounded-md cursor-pointer" title="Rename">✏️</button>
        <Btn variant="secondary" size="sm" onClick={() => onEdit(section.id)}>Edit</Btn>
        <Btn variant={section.is_visible ? 'success' : 'ghost'} size="sm" onClick={() => onToggle(section.id)}>
          {section.is_visible ? 'Visible' : 'Hidden'}
        </Btn>
      </div>
    </div>
  )
}

export function SectionManagerClient({ initialSections }: { initialSections: Section[] }) {
  const [sections, setSections] = useState(initialSections)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const persistOrder = async (ordered: Section[]) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/sections/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionIds: ordered.map(s => s.id) }),
      })
      if (!res.ok) throw new Error()
      setToast({ msg: 'Order saved.', type: 'success' })
    } catch {
      setToast({ msg: 'Failed to save order.', type: 'error' })
    }
    setSaving(false)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSections(prev => {
      const oldIndex = prev.findIndex(s => s.id === active.id)
      const newIndex = prev.findIndex(s => s.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex)
      persistOrder(reordered)
      return reordered
    })
  }

  const toggleVisibility = async (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, is_visible: !s.is_visible } : s))
    const section = sections.find(s => s.id === id)
    await fetch(`/api/admin/sections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: !section?.is_visible }),
    })
  }

  const renameSection = async (id: string, label: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, label } : s))
    await fetch(`/api/admin/sections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    })
    setToast({ msg: 'Section renamed.', type: 'success' })
  }

  const saveContent = async (id: string, content: unknown) => {
    const res = await fetch(`/api/admin/sections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setSections(prev => prev.map(s => s.id === id ? data : s))
      setToast({ msg: 'Section saved.', type: 'success' })
      setEditingId(null)
    } else {
      setToast({ msg: 'Failed to save section.', type: 'error' })
    }
  }

  const editingSection = sections.find(s => s.id === editingId)

  if (editingSection) {
    return (
      <SectionEditorPanel
        section={editingSection}
        onSave={content => saveContent(editingSection.id, content)}
        onCancel={() => setEditingId(null)}
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div className="text-muted text-[13px]">
          {sections.filter(s => s.is_visible).length} of {sections.length} sections visible
          {saving && ' · saving…'}
        </div>
        <div className="flex gap-1.5">
          <FieldTag color="green">{sections.filter(s => s.is_visible).length} visible</FieldTag>
          <FieldTag color="gray">{sections.filter(s => !s.is_visible).length} hidden</FieldTag>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map(section => (
            <SortableRow
              key={section.id}
              section={section}
              onToggle={toggleVisibility}
              onRename={renameSection}
              onEdit={setEditingId}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="mt-8 p-6 bg-card border border-dashed border-border rounded-xl text-center">
        <div className="text-muted text-[13px] mb-2">Section order is saved automatically and reflects live on the site.</div>
        <div className="text-dimmer text-xs">Drag the ⠿⠿ handle to reorder · Click Edit to modify content · Toggle visibility anytime</div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
