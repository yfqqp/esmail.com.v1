// src/components/admin/users/UsersManagerClient.tsx
'use client'

import { useState } from 'react'
import type { Profile, AppRole } from '@/types'
import { Toast, FieldTag } from '@/components/admin/shared/ui'

const ROLE_COLOR: Record<AppRole, 'green' | 'accent' | 'amber' | 'gray'> = {
  owner: 'green', admin: 'accent', editor: 'amber', viewer: 'gray',
}

export function UsersManagerClient({ initial, currentUserId, isOwner }: {
  initial: Profile[]
  currentUserId: string
  isOwner: boolean
}) {
  const [users, setUsers] = useState(initial)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const updateRole = async (id: string, role: AppRole) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setUsers(prev => prev.map(u => u.id === id ? data : u))
      setToast({ msg: 'Role updated.', type: 'success' })
    } else {
      const { error } = await res.json()
      setToast({ msg: error ?? 'Failed to update role.', type: 'error' })
    }
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setUsers(prev => prev.map(u => u.id === id ? data : u))
      setToast({ msg: is_active ? 'User reactivated.' : 'User deactivated.', type: 'success' })
    }
  }

  return (
    <div>
      {!isOwner && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6 text-[13px] text-muted">
          Only the site owner can change roles. You can view team members here.
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">Email</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">Joined</th>
              {isOwner && <th className="px-5 py-3 w-[140px]" />}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5 text-[13px] text-[var(--color-text)]">
                  {u.email} {u.id === currentUserId && <span className="text-dimmer text-xs">(you)</span>}
                </td>
                <td className="px-5 py-3.5">
                  {isOwner && u.id !== currentUserId ? (
                    <select
                      value={u.role}
                      onChange={e => updateRole(u.id, e.target.value as AppRole)}
                      className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)]"
                    >
                      {['owner','admin','editor','viewer'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <FieldTag color={ROLE_COLOR[u.role]}>{u.role}</FieldTag>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <FieldTag color={u.is_active ? 'green' : 'gray'}>{u.is_active ? 'active' : 'inactive'}</FieldTag>
                </td>
                <td className="px-5 py-3.5 text-dimmer text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                {isOwner && (
                  <td className="px-5 py-3.5">
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => toggleActive(u.id, !u.is_active)}
                        className="text-xs font-semibold bg-transparent border-0 cursor-pointer"
                        style={{ color: u.is_active ? '#EF4444' : '#22C55E' }}
                      >
                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-card border border-dashed border-border rounded-xl text-xs text-dimmer leading-relaxed">
        New users sign up via Supabase Auth and start as <strong>viewer</strong> until promoted.
        The first account ever created automatically becomes <strong>owner</strong>.
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
