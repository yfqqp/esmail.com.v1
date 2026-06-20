// src/components/blocks/HeroBlock.tsx
'use client'

import { useEffect, useRef } from 'react'
import type { Section, HeroContent } from '@/types'
import { FadeUp } from './shared'

function OrbitCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: 0, y: 0 })
  const raf = useRef<number>(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = canvas.offsetWidth, h = canvas.offsetHeight
    canvas.width = w; canvas.height = h

    const onResize = () => { w = canvas.offsetWidth; h = canvas.offsetHeight; canvas.width = w; canvas.height = h }
    const onMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    window.addEventListener('resize', onResize)
    canvas.addEventListener('mousemove', onMouse)

    const cx = w / 2, cy = h / 2
    const RINGS = [
      { r: 72, n: 5, spd: 0.005, col: 'rgba(79,110,247,0.9)', sz: 2.5 },
      { r: 128, n: 8, spd: -0.003, col: 'rgba(79,110,247,0.55)', sz: 1.8 },
      { r: 190, n: 13, spd: 0.002, col: 'rgba(79,110,247,0.32)', sz: 1.3 },
      { r: 256, n: 18, spd: -0.0014, col: 'rgba(240,165,0,0.28)', sz: 1.0 },
    ]
    const pts = RINGS.flatMap((ring, ri) =>
      Array.from({ length: ring.n }, (_, i) => ({ ri, angle: (i / ring.n) * Math.PI * 2 }))
    )

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70)
      g.addColorStop(0, 'rgba(79,110,247,0.18)'); g.addColorStop(1, 'transparent')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2); ctx.fill()

      RINGS.forEach(ring => {
        ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(79,110,247,0.07)'; ctx.lineWidth = 1; ctx.stroke()
      })

      const mx = mouse.current.x || cx, my = mouse.current.y || cy
      const dx = (mx - cx) / w, dy = (my - cy) / h

      pts.forEach(p => {
        const ring = RINGS[p.ri]
        p.angle += ring.spd
        const x = cx + Math.cos(p.angle) * ring.r + dx * ring.r * 0.04
        const y = cy + Math.sin(p.angle) * ring.r + dy * ring.r * 0.04
        const gw = ctx.createRadialGradient(x, y, 0, x, y, ring.sz * 3.5)
        gw.addColorStop(0, ring.col); gw.addColorStop(1, 'transparent')
        ctx.fillStyle = gw; ctx.beginPath(); ctx.arc(x, y, ring.sz * 3.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x, y, ring.sz * 0.6, 0, Math.PI * 2); ctx.fill()
      })

      ctx.fillStyle = '#4F6EF7'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill()

      raf.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return <canvas ref={ref} className="w-full h-full block" />
}

export function HeroBlock({ section }: { section: Section }) {
  const content = section.content as unknown as HeroContent
  const [firstName, ...rest] = content.name.split(' ')

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div id={section.slug} className="min-h-screen flex items-center relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 60% 50%, rgba(79,110,247,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="mx-auto max-w-[1200px] w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
        style={{ padding: '0 clamp(1.5rem, 5vw, 3.5rem)' }}
      >
        <div>
          <FadeUp delay={0.1}>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
              style={{ background: 'rgba(79,110,247,0.12)', border: '1px solid rgba(79,110,247,0.22)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-accent text-xs font-medium tracking-wide">{content.badge}</span>
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <h1 className="font-display font-extrabold text-[clamp(3rem,7vw,5.5rem)] leading-[1.0] mb-2 text-[var(--color-text)]">
              {firstName}<br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #4F6EF7, #F0A500)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {rest.join(' ')}
              </span>
            </h1>
            <div className="text-muted text-[clamp(0.9rem,2vw,1.1rem)] mb-6 tracking-wide">{content.role}</div>
          </FadeUp>

          <FadeUp delay={0.3}>
            <p className="text-muted text-[clamp(0.95rem,1.8vw,1.1rem)] leading-relaxed mb-10 max-w-[480px]">
              {content.intro}
            </p>
          </FadeUp>

          <FadeUp delay={0.4}>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => scrollTo(content.cta1Link)}
                className="bg-accent text-white border-none px-7 py-3.5 rounded-[10px] text-sm font-semibold cursor-pointer hover:bg-accent-dim transition-colors"
              >
                {content.cta1Text} →
              </button>
              <button
                onClick={() => scrollTo(content.cta2Link)}
                className="bg-transparent text-[var(--color-text)] border border-border px-7 py-3.5 rounded-[10px] text-sm font-semibold cursor-pointer hover:border-accent hover:text-accent transition-colors"
              >
                {content.cta2Text}
              </button>
            </div>
          </FadeUp>

          <FadeUp delay={0.55}>
            <div className="flex gap-10 mt-12 pt-8 border-t border-border flex-wrap">
              {content.stats.map(s => (
                <div key={s.label}>
                  <div className="font-display text-[1.8rem] font-extrabold text-[var(--color-text)]">{s.value}</div>
                  <div className="text-muted text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>

        <FadeUp delay={0.2} style={{ height: '520px', position: 'relative' }}>
          <OrbitCanvas />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="font-display text-xs font-bold text-accent tracking-[0.12em]">INTJ</div>
            <div className="text-muted text-[10px] mt-0.5">Architect</div>
          </div>
        </FadeUp>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-dimmer text-[10px] tracking-[0.12em]">SCROLL</span>
        <div className="w-px h-9" style={{ background: 'linear-gradient(#4F6EF7, transparent)' }} />
      </div>
    </div>
  )
}
