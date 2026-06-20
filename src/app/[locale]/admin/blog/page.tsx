// src/app/[locale]/admin/blog/page.tsx
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/shared/ui'
import { BlogManagerClient } from '@/components/admin/blog/BlogManagerClient'

export default async function AdminBlogPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader title="Blog" description="Personal thoughts, reflections, and journal entries" />
      <BlogManagerClient initial={data ?? []} />
    </div>
  )
}
