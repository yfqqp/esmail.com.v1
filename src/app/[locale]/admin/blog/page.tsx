// src/app/[locale]/admin/blog/page.tsx
import { adminGetAllBlogPosts } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { BlogManagerClient } from '@/components/admin/blog/BlogManagerClient'

export default async function AdminBlogPage() {
  const posts = await adminGetAllBlogPosts()
  return (
    <div>
      <PageHeader title="Blog" description="Personal thoughts, reflections, and journal entries" />
      <BlogManagerClient initial={posts} />
    </div>
  )
}
