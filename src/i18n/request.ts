// src/i18n/request.ts
// next-intl per-request locale configuration (App Router pattern)

import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

const LOCALES = ['en', 'ar', 'ru'] as const
type Locale = typeof LOCALES[number]

export default getRequestConfig(async ({ locale }) => {
  if (!LOCALES.includes(locale as Locale)) notFound()

  const messages = (await import(`../../messages/${locale}.json`)).default

  return {
    locale,
    messages,
    timeZone: 'Asia/Riyadh',
    now: new Date(),
  }
})
