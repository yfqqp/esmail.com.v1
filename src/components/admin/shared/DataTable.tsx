// src/components/admin/shared/DataTable.tsx
'use client'

import type { ReactNode } from 'react'
import { FieldTag } from './ui'

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
  width?: string
}

export function DataTable<T extends { id: string }>({
  columns, rows, onEdit, onDelete, emptyMessage = 'No items yet.',
}: {
  columns: Column<T>[]
  rows: T[]
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  emptyMessage?: string
}) {
  if (rows.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
        <p className="text-muted text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-5 py-3 w-[120px]" />}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-5 py-3.5 text-[13px] text-[var(--color-text)]">
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-5 py-3.5">
                  <div className="flex gap-2 justify-end">
                    {onEdit && (
                      <button onClick={() => onEdit(row)} className="text-accent text-xs font-semibold bg-transparent border-0 cursor-pointer">
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(row)} className="text-[#EF4444] text-xs font-semibold bg-transparent border-0 cursor-pointer">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, 'green' | 'amber' | 'gray'> = {
    published: 'green', active: 'green', draft: 'amber', planned: 'gray', archived: 'gray', completed: 'gray', on_hold: 'amber',
  }
  return <FieldTag color={colorMap[status] ?? 'gray'}>{status}</FieldTag>
}
