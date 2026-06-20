// src/app/[locale]/admin/seo/page.tsx
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/shared/ui'
import { SEOManagerClient } from '@/components/admin/seo/SEOManagerClient'

export default async function AdminSEOPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('seo_settings').select('*').order('page_key')

  return (
    <div>
      <PageHeader title="SEO" description="Titles, descriptions, Open Graph data, and indexing per page" />
      <SEOManagerClient initial={data ?? []} />
    </div>
  )
}
