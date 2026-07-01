// src/components/blocks/JournalBlock.tsx
import Link from 'next/link'
import type { Section, JournalContent, BlogPost } from '@/types'
import { SectionWrap, SectionEyebrow, Heading, FadeUp } from './shared'

export function JournalBlock({ section, posts, locale }: { section: Section; posts: BlogPost[]; locale: string }) {
  const content = section.content as unknown as JournalContent

  return (
    <SectionWrap id={section.slug}>
      <FadeUp><SectionEyebrow text={section.label} /></FadeUp>
      <FadeUp delay={0.1}>
        <Heading>How I <span style={{ color: '#F0A500' }}>think</span></Heading>
      </FadeUp>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {posts.map((post, i) => (
          <FadeUp key={post.id} delay={i * 0.08}>
            <Link
              href={`/${locale}/blog/${post.slug}`}
              className="block bg-card border border-border rounded-2xl p-7 transition-all hover:-translate-y-1"
              style={{ borderColor: '#1A2540' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#F0A500')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1A2540')}
            >
              <div className="font-display text-[2.5rem] leading-none mb-3" style={{ color: '#F0A500', opacity: 0.25 }}>&ldquo;</div>
              <h3 className="font-display text-base font-bold text-[var(--color-text)] mb-3">{post.title}</h3>
              <p className="text-muted text-[13.5px] leading-relaxed italic mb-5">{post.excerpt}</p>
              <span className="text-dimmer text-[11px]">
                {post.published_at ? new Date(post.published_at).getFullYear() : ''}
              </span>
            </Link>
          </FadeUp>
        ))}
      </div>

      {content.principles?.length > 0 && (
        <FadeUp delay={0.4}>
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="font-display text-base font-bold text-[var(--color-text)] mb-6">Principles I live by</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.principles.map((p, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <div
                    className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0 mt-px"
                    style={{ background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.2)' }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: '#F0A500' }}>{i + 1}</span>
                  </div>
                  <p className="text-muted text-[13.5px] leading-relaxed m-0">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      )}
    </SectionWrap>
  )
}
