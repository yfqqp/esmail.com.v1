// src/app/[locale]/login/page.tsx
'use client'

// إجبار Next.js على بناء هذه الصفحة ديناميكياً وقت التشغيل لتخطي أخطاء الـ Prerender و next-intl
export const dynamic = 'force-dynamic'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const redirect = searchParams.get('redirect') ?? '/en/admin'
    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-void px-6">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4F6EF7, #F0A500)' }}
          >
            <span className="text-white text-base font-extrabold font-display">IS</span>
          </div>
          <span className="text-[var(--color-text)] font-display font-bold text-lg">Admin</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-accent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-accent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-white border-none rounded-lg py-3 text-sm font-semibold mt-2 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-dimmer text-xs text-center mt-6">
          The first account ever created automatically becomes the site owner.
        </p>
      </div>
    </div>
  )
}
