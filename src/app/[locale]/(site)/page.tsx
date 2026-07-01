// src/app/[locale]/(site)/page.tsx
// The entire homepage composition comes from the database. This file
// contains ZERO hardcoded section order or content — it fetches visible
// sections sorted by sort_order and renders each through the block registry.
// Adding, removing, reordering, hiding, or renaming a section from the
// admin dashboard changes this page with no code deploy required.

import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getPublicSections, getSEOSettings } from '@/services'
import { RenderSection } from '@/components/blocks/registry'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSEOSettings('home')
  return {
    title: seo?.title ?? 'Ismail Safwan',
    description: seo?.description ?? undefined,
    openGraph: {
      title: seo?.og_title ?? seo?.title ?? undefined,
      description: seo?.og_description ?? seo?.description ?? undefined,
      images: seo?.og_image_url ? [seo.og_image_url] : undefined,
    },
    robots: seo?.no_index ? { index: false } : undefined,
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const sections = await getPublicSections()

  return (
    <>
      {sections.map(section => (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <RenderSection key={section.id} section={section} locale={locale} />
      ))}
    </>
  )
}
