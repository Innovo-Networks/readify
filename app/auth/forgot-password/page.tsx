'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import TurnstileWidget, { TURNSTILE_ENABLED } from '@/components/auth/TurnstileWidget'
import { Loader2, BookOpen } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (TURNSTILE_ENABLED && !captchaToken) { setError('Please complete the security check'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
      captchaToken: captchaToken ?? undefined,
    })
    setCaptchaKey((k) => k + 1)
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <BookOpen className="w-7 h-7 text-gold-500" />
          <span className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>
            Read<span className="text-gold-500">ify</span>
          </span>
        </Link>

        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>Forgot your password?</h1>

        {sent ? (
          <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            If an account exists for <strong>{email}</strong>, we have sent a link to reset your password. Check your inbox (and spam folder).
          </p>
        ) : (
          <>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              Enter the email address for your account and we will send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full py-3 px-4 rounded-xl border text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaKey} />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #f5a623, #d4861a)', color: '#0a0a0a' }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send reset link
              </button>
            </form>
          </>
        )}

        <p className="text-sm mt-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <Link href="/auth/login" className="text-gold-500 hover:text-gold-400">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
