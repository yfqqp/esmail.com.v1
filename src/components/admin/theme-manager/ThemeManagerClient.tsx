// src/components/admin/theme-manager/ThemeManagerClient.tsx
'use client'

import { useState } from 'react'
import type { ThemeSettings } from '@/types'
import { Btn, Label, Toast, AdminCard } from '@/components/admin/shared/ui'

const COLOR_FIELDS: Array<{ key: keyof ThemeSettings['colors']; label: string }> = [
  { key: 'accent', label: 'Accent' },
  { key: 'accent_dim', label: 'Accent (Dim)' },
  { key: 'amber', label: 'Secondary' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'card', label: 'Card' },
  { key: 'text_primary', label: 'Primary Text' },
  { key: 'text_muted', label: 'Muted Text' },
  { key: 'border', label: 'Border' },
]

const FONT_OPTIONS = ['Syne', 'Inter', 'Space Grotesk', 'Outfit', 'DM Sans', 'Manrope', 'Playfair Display']

export function ThemeManagerClient({ initial }: { initial: ThemeSettings }) {
  const [theme, setTheme] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const updateColor = (key: keyof ThemeSettings['colors'], value: string) => {
    setTheme(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }))
  }

  const updateTypography = (key: keyof ThemeSettings['typography'], value: string | number) => {
    setTheme(prev => ({ ...prev, typography: { ...prev.typography, [key]: value } }))
  }

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colors: theme.colors, typography: theme.typography, spacing: theme.spacing }),
    })
    setSaving(false)
    setToast(res.ok ? { msg: 'Theme saved. Changes apply site-wide.', type: 'success' } : { msg: 'Failed to save theme.', type: 'error' })
  }

  return (
    <div className="max-w-[760px]">
      <AdminCard className="mb-6">
        <div className="text-[var(--color-text)] text-sm font-semibold mb-5">Colors</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COLOR_FIELDS.map(f => (
            <div key={f.key} className="flex items-center gap-2.5 bg-surface border border-border rounded-lg px-3.5 py-2.5">
              <input
                type="color"
                value={theme.colors[f.key]}
                onChange={e => updateColor(f.key, e.target.value)}
                className="w-8 h-8 border-0 rounded-md cursor-pointer bg-transparent p-0"
              />
              <div>
                <div className="text-[var(--color-text)] text-xs font-medium">{f.label}</div>
                <div className="text-dimmer text-[11px] mt-0.5">{theme.colors[f.key]}</div>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="mb-6">
        <div className="text-[var(--color-text)] text-sm font-semibold mb-5">Typography</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Display Font</Label>
            <select
              value={theme.typography.font_display}
              onChange={e => updateTypography('font_display', e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-[var(--color-text)]"
            >
              {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <Label>Body Font</Label>
            <select
              value={theme.typography.font_body}
              onChange={e => updateTypography('font_body', e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-[var(--color-text)]"
            >
              {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </AdminCard>

      <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Theme'}</Btn>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
