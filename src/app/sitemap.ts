// src/app/sitemap.ts
// Next.js metadata route convention — automatically served at /sitemap.xml.
// Pulls live published projects and blog posts so the sitemap never goes
// stale as content is added through the admin dashboard.

import type { MetadataRoute } from 'next'
import { getPublishedProjects, getPublishedBlogPosts } from '@/services'

const LOCALES = ['en', 'ar', 'ru']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const [{ data: projects }, { data: posts }] = await Promise.all([
    getPublishedProjects({ limit: 500 }),
    getPublishedBlogPosts({ limit: 500 }),
  ])

  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap(locale => [
    { url: `${baseUrl}/${locale}`, changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/${locale}/gallery`, changeFrequency: 'monthly' as const, priority: 0.5 },
  ])

  const projectEntries: MetadataRoute.Sitemap = LOCALES.flatMap(locale =>
    projects.map(p => ({
      url: `${baseUrl}/${locale}/projects/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  )

  const blogEntries: MetadataRoute.Sitemap = LOCALES.flatMap(locale =>
    posts.map(p => ({
      url: `${baseUrl}/${locale}/blog/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  )

  return [...staticEntries, ...projectEntries, ...blogEntries]
}
