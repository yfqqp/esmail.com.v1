// src/components/admin/shared/ui.tsx
'use client'

import { useEffect, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'amber'

const VARIANT_STYLES: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-dim',
  secondary: 'bg-card text-[var(--color-text)] border border-border hover:border-border-bright',
  ghost: 'bg-transparent text-muted border border-border hover:text-[var(--color-text)]',
  danger: 'text-[#EF4444] border border-[rgba(239,68,68,0.25)]',
  success: 'text-[#22C55E] border border-[rgba(34,197,94,0.25)]',
  amber: 'text-[#F0A500] border border-[rgba(240,165,0,0.25)]',
}

export function Btn({
  children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', className = '',
}: {
  children: ReactNode
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  const sizeClasses = { sm: 'px-3 py-1.5 text-xs', md: 'px-4.5 py-2.5 text-[13px]', lg: 'px-7 py-3.5 text-[15px]' }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[10px] font-semibold transition-all border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${VARIANT_STYLES[variant]} ${className}`}
      style={variant === 'danger' ? { background: 'rgba(239,68,68,0.12)' } : variant === 'success' ? { background: 'rgba(34,197,94,0.12)' } : variant === 'amber' ? { background: 'rgba(240,165,0,0.10)' } : undefined}
    >
      {children}
    </button>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-[var(--color-text)] outline-none focus:border-accent transition-colors ${props.className ?? ''}`}
    />
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-[var(--color-text)] outline-none focus:border-accent transition-colors resize-y ${props.className ?? ''}`}
    />
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">{children}</div>
}

export function FieldTag({ children, color = 'accent' }: { children: ReactNode; color?: 'accent' | 'amber' | 'green' | 'gray' }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    accent: { bg: 'rgba(79,110,247,0.12)', text: '#4F6EF7', border: 'rgba(79,110,247,0.25)' },
    amber: { bg: 'rgba(240,165,0,0.10)', text: '#F0A500', border: 'rgba(240,165,0,0.25)' },
    green: { bg: 'rgba(34,197,94,0.1)', text: '#22C55E', border: 'rgba(34,197,94,0.25)' },
    gray: { bg: 'rgba(255,255,255,0.04)', text: '#7A869A', border: '#1A2540' },
  }
  const c = colors[color]
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {children}
    </span>
  )
}

export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  const colors = { success: '#22C55E', error: '#EF4444', info: '#4F6EF7' }
  return (
    <div
      className="fixed bottom-8 right-8 z-[9999] bg-card border border-border rounded-xl px-4.5 py-3 flex items-center gap-2.5 shadow-2xl"
      style={{ borderLeft: `3px solid ${colors[type]}` }}
    >
      <span style={{ color: colors[type] }} className="text-sm">{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span className="text-[var(--color-text)] text-[13px]">{message}</span>
      <button onClick={onClose} className="bg-transparent border-0 text-muted ml-2 text-base cursor-pointer">×</button>
    </div>
  )
}

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-card border border-border rounded-2xl p-6 ${className}`}>{children}</div>
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-7">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[var(--color-text)]">{title}</h1>
        {description && <p className="text-muted text-xs mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}
