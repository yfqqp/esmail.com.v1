// src/app/[locale]/login/page.tsx
// Two-step OTP login UI. Contains zero authentication logic itself — it only
// calls /api/auth/login (request a code) and /api/auth/verify-otp (submit
// the code), both of which run entirely server-side. No password field
// exists anywhere in this system; the OTP is the only credential.

'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Step = 'choose-method' | 'enter-code'

function LoginFlow() {
  const [step, setStep] = useState<Step>('choose-method')
  const [method, setMethod] = useState<'email' | 'telegram'>('email')
  const [otpId, setOtpId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const requestCode = async (selectedMethod: 'email' | 'telegram') => {
    setLoading(true)
    setError(null)
    setMethod(selectedMethod)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: selectedMethod }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? 'Failed to send verification code.')
        setLoading(false)
        return
      }

      setOtpId(data.data.otpId)
      setInfo(`A 6-digit code was sent via ${selectedMethod === 'email' ? 'email' : 'Telegram'}. It expires in ${data.data.expiresInMinutes} minutes.`)
      setStep('enter-code')
    } catch {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault()
    if (!otpId) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpId, code }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? 'Verification failed.')
        setLoading(false)
        return
      }

      const redirect = searchParams.get('redirect') ?? '/en/admin'
      router.push(redirect)
      router.refresh()
    } catch {
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  return (
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

      <div className="bg-card border border-border rounded-2xl p-8">
        {step === 'choose-method' && (
          <>
            <p className="text-muted text-sm mb-6 text-center">
              Choose how you&apos;d like to receive your one-time login code.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => requestCode('email')}
                disabled={loading}
                className="bg-accent text-white border-none rounded-lg py-3 text-sm font-semibold disabled:opacity-50"
              >
                {loading && method === 'email' ? 'Sending…' : '📧 Send code via Email'}
              </button>
              <button
                onClick={() => requestCode('telegram')}
                disabled={loading}
                className="bg-surface border border-border text-[var(--color-text)] rounded-lg py-3 text-sm font-semibold disabled:opacity-50"
              >
                {loading && method === 'telegram' ? 'Sending…' : '✈️ Send code via Telegram'}
              </button>
            </div>
          </>
        )}

        {step === 'enter-code' && (
          <form onSubmit={verifyCode} className="flex flex-col gap-4">
            {info && (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(79,110,247,0.1)', color: '#4F6EF7', border: '1px solid rgba(79,110,247,0.25)' }}>
                {info}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5 block">6-Digit Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-2xl text-center tracking-[0.4em] text-[var(--color-text)] outline-none focus:border-accent font-mono"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="bg-accent text-white border-none rounded-lg py-3 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('choose-method'); setCode(''); setError(null); setInfo(null) }}
              className="bg-transparent border-0 text-muted text-xs underline cursor-pointer"
            >
              Use a different method
            </button>
          </form>
        )}
      </div>

      <p className="text-dimmer text-xs text-center mt-6">
        Single-owner access only. No registration, no passwords.
      </p>
    </div>
  )
}

// useSearchParams() requires a Suspense boundary in Next.js 15 or the build
// fails — see the project's earlier audit notes.
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-void px-6">
      <Suspense fallback={<div className="text-muted text-sm">Loading…</div>}>
        <LoginFlow />
      </Suspense>
    </div>
  )
}
