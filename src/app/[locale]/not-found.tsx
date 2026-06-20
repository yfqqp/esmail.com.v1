// src/app/[locale]/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-void px-6">
      <div className="text-center">
        <div className="font-display text-[clamp(4rem,12vw,8rem)] font-extrabold text-accent leading-none mb-4">404</div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)] mb-3">Page not found</h1>
        <p className="text-muted text-sm mb-8 max-w-[400px] mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link
          href="/en"
          className="inline-block bg-accent text-white px-6 py-3 rounded-[10px] text-sm font-semibold"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
