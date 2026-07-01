// src/app/[locale]/(site)/blog/[slug]/page.tsx
// force-dynamic: this route has no generateStaticParams because slugs are
// created and edited via the CMS at runtime. Enumerating them at build time
// would mean new posts don't get a working page until the next deploy.
// This is a genuine dynamic-segment requirement, not a default applied for
// convenience — the homepage and (site) layout remain statically rendered.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getBlogPostBySlug } from '@/services'
import { Tag } from '@/components/blocks/shared'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    openGraph: { images: post.seo_og_image ? [post.seo_og_image] : undefined },
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  setRequestLocale(locale)

  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  return (
    <article className="max-w-[760px] mx-auto" style={{ padding: '160px clamp(1.5rem, 5vw, 3.5rem) 100px' }}>
      <div className="flex items-center gap-3 mb-6">
        <Tag color="amber">{post.category}</Tag>
        {post.published_at && (
          <span className="text-dimmer text-xs">
            {new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        )}
        {post.reading_time_minutes && (
          <span className="text-dimmer text-xs">· {post.reading_time_minutes} min read</span>
        )}
      </div>

      <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-extrabold text-[var(--color-text)] mb-6 leading-tight">
        {post.title}
      </h1>

      {post.excerpt && (
        <p className="text-muted text-lg leading-relaxed mb-10 italic">{post.excerpt}</p>
      )}

      {post.content && (
        <div
          className="prose prose-invert max-w-none text-muted leading-relaxed"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {post.content}
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-border">
          {post.tags.map(t => <Tag key={t} color="gray">{t}</Tag>)}
        </div>
      )}
    </article>
  )
}
