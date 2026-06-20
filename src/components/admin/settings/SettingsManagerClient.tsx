// src/components/admin/settings/SettingsManagerClient.tsx
'use client'

import { useState } from 'react'
import { Btn, Input, Label, Toast, AdminCard } from '@/components/admin/shared/ui'

interface SettingsProps {
  initial: Record<string, unknown>
}

const GROUPS: Array<{ key: string; label: string; fields: Array<{ key: string; label: string; type?: 'text' | 'checkbox' }> }> = [
  {
    key: 'general',
    label: 'General',
    fields: [
      { key: 'site_name', label: 'Site Name' },
      { key: 'site_tagline', label: 'Tagline' },
      { key: 'site_url', label: 'Production URL' },
      { key: 'default_language', label: 'Default Language' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact',
    fields: [{ key: 'contact_email', label: 'Contact Email' }],
  },
  {
    key: 'social',
    label: 'Social Links',
    fields: [
      { key: 'github_url', label: 'GitHub URL' },
      { key: 'linkedin_url', label: 'LinkedIn URL' },
      { key: 'twitter_url', label: 'X / Twitter URL' },
    ],
  },
  {
    key: 'features',
    label: 'Feature Flags',
    fields: [
      { key: 'ai_enabled', label: 'AI Chat Enabled', type: 'checkbox' },
      { key: 'blog_enabled', label: 'Blog Section Enabled', type: 'checkbox' },
      { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'checkbox' },
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    fields: [{ key: 'ga_measurement_id', label: 'Google Analytics ID (optional)' }],
  },
]

function unwrap(value: unknown): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

export function SettingsManagerClient({ initial }: SettingsProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, unwrap(v)]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const save = async (key: string, type?: string) => {
    setSaving(key)
    const raw = values[key]
    const value = type === 'checkbox' ? raw === 'true' : raw

    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setSaving(null)
    setToast(res.ok ? { msg: 'Saved.', type: 'success' } : { msg: 'Failed to save.', type: 'error' })
  }

  return (
    <div className="max-w-[600px] flex flex-col gap-6">
      {GROUPS.map(group => (
        <AdminCard key={group.key}>
          <div className="text-[var(--color-text)] text-sm font-semibold mb-4">{group.label}</div>
          <div className="flex flex-col gap-4">
            {group.fields.map(field => (
              <div key={field.key} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>{field.label}</Label>
                  {field.type === 'checkbox' ? (
                    <select
                      value={values[field.key] ?? 'false'}
                      onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-[var(--color-text)]"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <Input value={values[field.key]?.replace(/^"|"$/g, '') ?? ''} onChange={e => setValues(prev => ({ ...prev, [field.key]: JSON.stringify(e.target.value) }))} />
                  )}
                </div>
                <Btn size="sm" variant="secondary" onClick={() => save(field.key, field.type)} disabled={saving === field.key}>
                  {saving === field.key ? '…' : 'Save'}
                </Btn>
              </div>
            ))}
          </div>
        </AdminCard>
      ))}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
