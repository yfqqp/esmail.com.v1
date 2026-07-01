// src/components/blocks/shared.tsx
// Shared presentational primitives used by every block component.
// Keeping these in one file ensures visual consistency across all sections
// without each block re-implementing the same wrapper markup.

'use client'

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

export function useScrollAnim(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, visible] as const
}

export function FadeUp({
  children,
  delay = 0,
  style = {},
}: {
  children: ReactNode
  delay?: number
  style?: CSSProperties
}) {
  const [ref, visible] = useScrollAnim()
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(28px)',
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SectionWrap({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section
      id={id}
      className="min-h-screen mx-auto max-w-[1200px]"
      style={{ padding: '120px clamp(1.5rem, 5vw, 3.5rem)' }}
    >
      {children}
    </section>
  )
}

export function SectionEyebrow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-7 h-0.5 rounded-full bg-accent" />
      <span className="text-accent text-[11px] font-bold tracking-[0.14em] uppercase font-body">
        {text}
      </span>
    </div>
  )
}

export function Heading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`font-display font-extrabold text-[clamp(2rem,5vw,3.4rem)] leading-[1.08] text-[var(--color-text)] mb-5 ${className}`}
    >
      {children}
    </h2>
  )
}

export function Tag({ children, color = 'accent' }: { children: ReactNode; color?: 'accent' | 'amber' | 'green' | 'gray' }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    accent: { bg: 'rgba(79,110,247,0.12)', text: '#4F6EF7', border: 'rgba(79,110,247,0.25)' },
    amber: { bg: 'rgba(240,165,0,0.10)', text: '#F0A500', border: 'rgba(240,165,0,0.25)' },
    green: { bg: 'rgba(34,197,94,0.1)', text: '#22C55E', border: 'rgba(34,197,94,0.25)' },
    gray: { bg: 'rgba(255,255,255,0.04)', text: '#7A869A', border: '#1A2540' },
  }
  const c = colors[color]
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium font-body"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {children}
    </span>
  )
}
