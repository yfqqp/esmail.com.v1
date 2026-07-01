// src/components/site/SiteNav.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { NavigationItem } from '@/types'

const LOCALES = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
]

export function SiteNav({
  navItems,
  siteName,
  locale,
}: {
  navItems: NavigationItem[]
  siteName: string
  locale: string
}) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (target: string) => {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
    setLangOpen(false)
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(4,6,15,0.94)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid #1A2540' : 'none',
        padding: '0 clamp(1.5rem, 5vw, 3rem)',
      }}
    >
      <div className="flex items-center justify-between h-[62px] max-w-[1200px] mx-auto">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <div
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #4F6EF7, #F0A500)' }}
          >
            <span className="text-white text-xs font-extrabold font-display">IS</span>
          </div>
          <span className="text-[var(--color-text)] font-display font-bold text-sm">{siteName}</span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map(item => (
            item.item_type === 'section_anchor' ? (
              <button
                key={item.id}
                onClick={() => scrollTo(item.target)}
                className="bg-transparent border-0 text-muted px-3 py-1.5 rounded-lg cursor-pointer text-[13px] font-medium hover:text-[var(--color-text)] transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.id}
                href={item.item_type === 'external_url' ? item.target : `/${locale}${item.target}`}
                target={item.open_new_tab ? '_blank' : undefined}
                className="text-muted px-3 py-1.5 rounded-lg text-[13px] font-medium hover:text-[var(--color-text)] transition-colors"
              >
                {item.label}
              </Link>
            )
          ))}

          <div className="relative ml-2">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="bg-transparent border border-border text-muted px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
            >
              {LOCALES.find(l => l.code === locale)?.flag} {locale.toUpperCase()}
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-lg overflow-hidden min-w-[100px]">
                {LOCALES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => switchLocale(l.code)}
                    className="block w-full text-left px-4 py-2 text-xs text-muted hover:bg-surface hover:text-[var(--color-text)]"
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden bg-transparent border border-border rounded-lg p-2 flex flex-col gap-1"
        >
          {[0, 1, 2].map(i => <span key={i} className="block w-[18px] h-0.5 bg-[var(--color-text)] rounded-sm" />)}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-deep border-t border-border p-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => item.item_type === 'section_anchor' ? scrollTo(item.target) : router.push(item.target)}
              className="block w-full text-left bg-transparent border-0 text-muted py-3 text-base border-b border-border"
            >
              {item.label}
            </button>
          ))}
          <div className="flex gap-2 mt-3">
            {LOCALES.map(l => (
              <button
                key={l.code}
                onClick={() => switchLocale(l.code)}
                className="bg-surface border border-border text-muted px-3 py-1.5 rounded-lg text-xs"
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
