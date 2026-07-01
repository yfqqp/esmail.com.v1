// src/app/[locale]/admin/quotes/page.tsx
import { adminGetAllQuotes } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { QuotesManagerClient } from '@/components/admin/quotes/QuotesManagerClient'

export default async function AdminQuotesPage() {
  const items = await adminGetAllQuotes()
  return (
    <div>
      <PageHeader title="Quotes & Principles" description="Favorite quotes, beliefs, and personal principles" />
      <QuotesManagerClient initial={items} />
    </div>
  )
}
