// src/components/site/SiteFooter.tsx
import Link from 'next/link'

export function SiteFooter({ siteName, tagline, locale }: { siteName: string; tagline: string; locale: string }) {
  return (
    <footer className="border-t border-border max-w-[1200px] mx-auto" style={{ padding: '2.5rem clamp(1.5rem, 5vw, 3rem)' }}>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="font-display text-base font-extrabold text-[var(--color-text)] mb-1">{siteName}</div>
          <div className="text-dimmer text-xs">{tagline}</div>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/login`} className="text-dimmer text-xs hover:text-muted transition-colors">
            Admin
          </Link>
          <span className="text-dimmer text-xs">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  )
}
