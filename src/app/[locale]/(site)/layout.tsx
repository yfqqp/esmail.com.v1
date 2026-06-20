// src/app/[locale]/(site)/layout.tsx
import type { ReactNode } from 'react'
import { SiteNav } from '@/components/site/SiteNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { getNavigationItems, getSiteSettings } from '@/services'

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [navItems, settings] = await Promise.all([
    getNavigationItems(),
    getSiteSettings(),
  ])

  const siteName = (settings.site_name as string) ?? 'Ismail Safwan'
  const tagline = (settings.site_tagline as string) ?? 'Engineering the future.'

  return (
    <div className="min-h-screen bg-void">
      <SiteNav navItems={navItems} siteName={siteName} locale={locale} />
      <main>{children}</main>
      <SiteFooter siteName={siteName} tagline={tagline} locale={locale} />
    </div>
  )
}
