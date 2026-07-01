// src/app/[locale]/layout.tsx
// Root locale layout. Calls setRequestLocale(locale) before getMessages()
// so next-intl can resolve the locale statically for all child routes.

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Syne, Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import '../globals.css'

const LOCALES = ['en', 'ar', 'ru'] as const
type Locale = typeof LOCALES[number]
const RTL_LOCALES: Locale[] = ['ar']

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: {
    default: 'Ismail Safwan — Robotics & AI Engineer',
    template: '%s — Ismail Safwan',
  },
  description: 'Engineering the future through robotics, AI, and mechatronics.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(LOCALES, locale)) notFound()

  // Must be called before any next-intl API to enable static rendering.
  setRequestLocale(locale)

  const messages = await getMessages()
  const dir = RTL_LOCALES.includes(locale as Locale) ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} className={`dark ${syne.variable} ${inter.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
