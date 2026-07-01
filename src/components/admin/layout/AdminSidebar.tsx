// src/components/admin/layout/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_GROUPS = [
  {
    label: 'Content',
    items: [
      { href: 'sections', label: 'Sections', icon: '⊞' },
      { href: 'projects', label: 'Projects', icon: '🔧' },
      { href: 'timeline', label: 'Timeline', icon: '📍' },
      { href: 'certificates', label: 'Certificates', icon: '🎓' },
      { href: 'blog', label: 'Blog', icon: '📝' },
      { href: 'quotes', label: 'Quotes', icon: '💬' },
    ],
  },
  {
    label: 'Media & AI',
    items: [
      { href: 'media', label: 'Media Library', icon: '🖼️' },
      { href: 'ai-knowledge', label: 'AI Knowledge', icon: '🤖' },
    ],
  },
  {
    label: 'Design & Config',
    items: [
      { href: 'theme', label: 'Theme', icon: '🎨' },
      { href: 'navigation', label: 'Navigation', icon: '🧭' },
      { href: 'seo', label: 'SEO', icon: '🔍' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: 'analytics', label: 'Analytics', icon: '📊' },
      { href: 'settings', label: 'Settings', icon: '⚙️' },
    ],
  },
]

// Single-owner system — no user roster, so the sidebar just shows "Owner"
// rather than looking up a per-account email/profile that no longer exists.
export function AdminSidebar({ locale }: { locale: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const basePath = `/${locale}/admin`

  const handleSignOut = async () => {
    // Sign-out happens server-side via this API call — the session cookie
    // is HttpOnly and cannot be cleared by client-side JS directly.
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push(`/${locale}/login`)
    router.refresh()
  }

  return (
    <aside className="w-[230px] bg-deep border-r border-border flex flex-col flex-shrink-0 h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4F6EF7, #F0A500)' }}
          >
            <span className="text-white text-xs font-extrabold font-display">IS</span>
          </div>
          <div>
            <div className="font-display text-sm font-bold text-[var(--color-text)]">Admin</div>
            <div className="text-dimmer text-[10px]">Dashboard</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="mb-5">
            <div className="text-dimmer text-[10px] font-semibold uppercase tracking-wider px-3 mb-1.5">
              {group.label}
            </div>
            {group.items.map(item => {
              const href = `${basePath}/${item.href}`
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={item.href}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] mb-0.5 transition-colors"
                  style={{
                    background: active ? 'rgba(79,110,247,0.12)' : 'transparent',
                    color: active ? '#4F6EF7' : '#7A869A',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <span className="text-[15px]">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="px-3 py-2 text-[11px] text-dimmer">Signed in as Owner</div>
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-muted hover:text-[var(--color-text)]"
        >
          ← View Site
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#EF4444] bg-transparent border-0 w-full text-left cursor-pointer opacity-80 hover:opacity-100"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
