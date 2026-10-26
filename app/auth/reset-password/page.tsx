'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, BookOpen } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  // Email links carry a one-time token_hash. It is used only after the user taps
  // Continue, so email scanners that pre-open the link cannot consume it.
  const [tokenHash, setTokenHash] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const hash = new URLSearchParams(window.location.search).get('token_hash')
    if (hash) {
      setTokenHash(hash)
      setChecked(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session)
      setChecked(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  const handleContinue = async () => {
    if (!tokenHash) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
    setLoading(false)
    if (error) { setError(error.message); setTokenHash(null); return }
    setTokenHash(null)
    setReady(true)
    router.replace('/auth/reset-password')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Use at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/account'), 1500)
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

        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>Set a new password</h1>

        {done ? (
          <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>Your password has been updated. Taking you to your account…</p>
        ) : !checked ? (
          <div className="mt-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold-500" /></div>
        ) : tokenHash && !ready ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tap continue to set your new password.</p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleContinue}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #f5a623, #d4861a)', color: '#0a0a0a' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue
            </button>
          </div>
        ) : !ready ? (
          <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            This reset link is invalid or has expired. <Link href="/auth/forgot-password" className="text-gold-500">Request a new one</Link>.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-8">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full py-3 px-4 rounded-xl border text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full py-3 px-4 rounded-xl border text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #f5a623, #d4861a)', color: '#0a0a0a' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
