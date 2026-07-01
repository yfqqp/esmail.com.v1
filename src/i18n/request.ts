// src/i18n/request.ts
// next-intl per-request locale configuration (App Router, next-intl 3.22+).
// Uses requestLocale (not the deprecated locale param).
// now: new Date() is intentionally absent — it would produce a different
// value on every call and force every route into dynamic rendering.

import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'

const LOCALES = ['en', 'ar', 'ru'] as const

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(LOCALES, requested) ? requested : notFound()

  const messages = (await import(`../../messages/${locale}.json`)).default

  return {
    locale,
    messages,
    timeZone: 'Asia/Riyadh',
  }
})
