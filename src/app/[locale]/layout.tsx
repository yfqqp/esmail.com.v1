// src/app/[locale]/layout.tsx
// Real root layout. Sets <html lang> and dir, loads fonts, wraps the tree
// in NextIntlClientProvider so all Client Components can use useTranslations().

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import '../globals.css'

const LOCALES = ['en', 'ar', 'ru'] as const
type Locale = typeof LOCALES[number]
const RTL_LOCALES: Locale[] = ['ar']

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
  if (!LOCALES.includes(locale as Locale)) notFound()

  const messages = await getMessages()
  const dir = RTL_LOCALES.includes(locale as Locale) ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
