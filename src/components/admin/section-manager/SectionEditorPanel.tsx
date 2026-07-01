// src/components/admin/section-manager/SectionEditorPanel.tsx
'use client'

import { useState } from 'react'
import type { Section } from '@/types'
import { Btn, Input, Textarea, Label } from '@/components/admin/shared/ui'

// ── Generic JSON-shape editors per section type ─────────────────────────────
// Each editor receives the raw `content` object and an onChange callback.
// Simple line-based encodings (e.g. "Label · Value" per line) keep the admin
// UI lightweight without needing a separate React form per nested array item.

function HeroEditor({ content, onChange }: { content: any; onChange: (patch: any) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div><Label>Full Name</Label><Input value={content.name} onChange={e => onChange({ name: e.target.value })} /></div>
      <div><Label>Role / Title</Label><Input value={content.role} onChange={e => onChange({ role: e.target.value })} /></div>
      <div><Label>Introduction</Label><Textarea rows={3} value={content.intro} onChange={e => onChange({ intro: e.target.value })} /></div>
      <div><Label>Status Badge</Label><Input value={content.badge} onChange={e => onChange({ badge: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>CTA 1 Text</Label><Input value={content.cta1Text} onChange={e => onChange({ cta1Text: e.target.value })} /></div>
        <div><Label>CTA 1 Target (section slug)</Label><Input value={content.cta1Link} onChange={e => onChange({ cta1Link: e.target.value })} /></div>
        <div><Label>CTA 2 Text</Label><Input value={content.cta2Text} onChange={e => onChange({ cta2Text: e.target.value })} /></div>
        <div><Label>CTA 2 Target (section slug)</Label><Input value={content.cta2Link} onChange={e => onChange({ cta2Link: e.target.value })} /></div>
      </div>
      <div>
        <Label>Stats (Label · Value, one per line)</Label>
        <Textarea
          rows={4}
          value={content.stats.map((s: any) => `${s.label} · ${s.value}`).join('\n')}
          onChange={e => onChange({
            stats: e.target.value.split('\n').filter(Boolean).map((line: string) => {
              const [label, value] = line.split('·').map(s => s.trim())
              return { label: label || '', value: value || '' }
            })
          })}
        />
      </div>
    </div>
  )
}

function TimelineEditor({ content, onChange }: { content: any; onChange: (patch: any) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div><Label>Section Heading</Label><Input value={content.heading} onChange={e => onChange({ heading: e.target.value })} /></div>
      <div><Label>Subheading</Label><Textarea rows={2} value={content.subheading} onChange={e => onChange({ subheading: e.target.value })} /></div>
      <p className="text-dimmer text-xs">Timeline events are managed separately under Admin → Timeline.</p>
    </div>
  )
}

function AcademicEditor({ content, onChange }: { content: any; onChange: (patch: any) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div><Label>Section Heading</Label><Input value={content.heading} onChange={e => onChange({ heading: e.target.value })} /></div>
      <div>
        <Label>Stats (Icon | Label | Value, one per line)</Label>
        <Textarea
          rows={5}
          value={(content.stats ?? []).map((s: any) => `${s.icon} | ${s.label} | ${s.value}`).join('\n')}
          onChange={e => onChange({
            stats: e.target.value.split('\n').filter(Boolean).map((line: string) => {
              const [icon, label, value] = line.split('|').map(s => s.trim())
              return { icon: icon || '📊', label: label || '', value: value || '' }
            })
          })}
        />
      </div>
      <div>
        <Label>Research Tags (comma separated)</Label>
        <Input
          value={(content.researchTags ?? []).join(', ')}
          onChange={e => onChange({ researchTags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        />
      </div>
      <p className="text-dimmer text-xs">Certificates are managed separately under Admin → Certificates.</p>
    </div>
  )
}

function ProjectsEditor({ content, onChange }: { content: any; onChange: (patch: any) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div><Label>Section Heading</Label><Input value={content.heading} onChange={e => onChange({ heading: e.target.value })} /></div>
      <div>
        <Label>Items per page</Label>
        <Input type="number" value={content.itemsPerPage} onChange={e => onChange({ itemsPerPage: Number(e.target.value) })} />
      </div>
      <p className="text-dimmer text-xs">Individual projects are managed under Admin → Projects.</p>
    </div>
  )
}

function JournalEditor({ content, onChange }: { content: any; onChange: (patch: any) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div><Label>Section Heading</Label><Input value={content.heading} onChange={e => onChange({ heading: e.target.value })} /></div>
      <div>
        <Label>Principles (one per line)</Label>
        <Textarea rows={7} value={(content.principles ?? []).join('\n')} onChange={e => onChange({ principles: e.target.value.split('\n').filter(Boolean) })} />
      </div>
      <p className="text-dimmer text-xs">Blog posts are managed under Admin → Blog.</p>
    </div>
  )
}

function InterestsEditor({ content, onChange }: { content: any; onChange: (patch: any) => void }) {
  const updateItem = (i: number, patch: any) => {
    const items = [...content.items]
    items[i] = { ...items[i], ...patch }
    onChange({ items })
  }
  return (
    <div className="flex flex-col gap-4">
      <div><Label>Section Heading</Label><Input value={content.heading} onChange={e => onChange({ heading: e.target.value })} /></div>
      {content.items.map((item: any, i: number) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-4">
          <div className="flex justify-between mb-3">
            <span className="text-[var(--color-text)] text-[13px] font-semibold">Interest {i + 1}</span>
            <button onClick={() => onChange({ items: content.items.filter((_: any, j: number) => j !== i) })} className="bg-transparent border-0 text-[#EF4444] text-base cursor-pointer">✕</button>
          </div>
          <div className="grid grid-cols-[60px_1fr] gap-3 mb-3">
            <div><Label>Icon</Label><Input value={item.icon} onChange={e => updateItem(i, { icon: e.target.value })} /></div>
            <div><Label>Name</Label><Input value={item.name} onChange={e => updateItem(i, { name: e.target.value })} /></div>
          </div>
          <div><Label>Description</Label><Input value={item.desc} onChange={e => updateItem(i, { desc: e.target.value })} /></div>
        </div>
      ))}
      <Btn variant="secondary" onClick={() => onChange({ items: [...content.items, { icon: '⭐', name: 'New Interest', desc: 'Description here.' }] })}>+ Add Interest</Btn>
    </div>
  )
}

function VisionEditor({ content, onChange }: { content: any; onChange: (patch: any) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div><Label>Section Heading</Label><Input value={content.heading} onChange={e => onChange({ heading: e.target.value })} /></div>
      <div><Label>Dream Universities (one per line)</Label><Textarea rows={5} value={(content.universities ?? []).join('\n')} onChange={e => onChange({ universities: e.target.value.split('\n').filter(Boolean) })} /></div>
      <div><Label>Career Path</Label><Textarea rows={3} value={content.career} onChange={e => onChange({ career: e.target.value })} /></div>
      <div><Label>Desired Impact</Label><Textarea rows={3} value={content.impact} onChange={e => onChange({ impact: e.target.value })} /></div>
    </div>
  )
}

function QuotesEditor({ content, onChange }: { content: any; onChange: (patch: any) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div><Label>Section Heading</Label><Input value={content.heading} onChange={e => onChange({ heading: e.target.value })} /></div>
      <p className="text-dimmer text-xs">Individual quotes are managed under Admin → Quotes.</p>
    </div>
  )
}

function AIEditor({ content, onChange }: { content: any; onChange: (patch: any) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div><Label>Section Heading</Label><Input value={content.heading} onChange={e => onChange({ heading: e.target.value })} /></div>
      <div><Label>Subheading</Label><Textarea rows={2} value={content.subheading} onChange={e => onChange({ subheading: e.target.value })} /></div>
      <div><Label>Suggestion Chips (one per line)</Label><Textarea rows={5} value={(content.suggestions ?? []).join('\n')} onChange={e => onChange({ suggestions: e.target.value.split('\n').filter(Boolean) })} /></div>
    </div>
  )
}

function DefaultJsonEditor({ content, onChange }: { content: any; onChange: (patch: any) => void }) {
  const [text, setText] = useState(JSON.stringify(content, null, 2))
  return (
    <div>
      <Label>Raw JSON Content</Label>
      <Textarea
        rows={16}
        value={text}
        onChange={e => {
          setText(e.target.value)
          try { onChange(JSON.parse(e.target.value)) } catch { /* invalid JSON, ignore until valid */ }
        }}
        className="font-mono text-xs"
      />
    </div>
  )
}

const EDITOR_MAP: Record<string, React.ComponentType<{ content: any; onChange: (patch: any) => void }>> = {
  hero: HeroEditor,
  timeline: TimelineEditor,
  academic: AcademicEditor,
  projects: ProjectsEditor,
  journal: JournalEditor,
  interests: InterestsEditor,
  vision: VisionEditor,
  quotes: QuotesEditor,
  ai_assistant: AIEditor,
}

export function SectionEditorPanel({
  section, onSave, onCancel,
}: {
  section: Section
  onSave: (content: unknown) => void
  onCancel: () => void
}) {
  const [content, setContent] = useState(section.content as any)
  const Editor = EDITOR_MAP[section.section_type] ?? DefaultJsonEditor

  const handleChange = (patch: any) => setContent((prev: any) => ({ ...prev, ...patch }))

  return (
    <div className="max-w-[720px]">
      <Editor content={content} onChange={handleChange} />
      <div className="flex gap-2.5 mt-8 pt-6 border-t border-border">
        <Btn onClick={() => onSave(content)}>Save Changes</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}
