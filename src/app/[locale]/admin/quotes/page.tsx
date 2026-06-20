// src/app/[locale]/admin/quotes/page.tsx
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/shared/ui'
import { QuotesManagerClient } from '@/components/admin/quotes/QuotesManagerClient'

export default async function AdminQuotesPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('quotes').select('*').order('sort_order')

  return (
    <div>
      <PageHeader title="Quotes & Principles" description="Favorite quotes, beliefs, and personal principles" />
      <QuotesManagerClient initial={data ?? []} />
    </div>
  )
}
