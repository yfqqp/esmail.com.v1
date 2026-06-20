// src/app/layout.tsx
// Root layout required by Next.js App Router. Actual HTML structure,
// fonts, and providers live in src/app/[locale]/layout.tsx since every
// real route is locale-prefixed. This file only exists to satisfy Next.js's
// requirement for a root layout and passes children through untouched.

import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
