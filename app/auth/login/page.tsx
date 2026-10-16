'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GOOGLE_AUTH_ENABLED } from '@/lib/payments'
import { safeRedirect, withRedirect } from '@/lib/auth-redirect'
import { Loader2, Eye, EyeOff, BookOpen, ShieldCheck, Zap, Globe } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(redirect)
    router.refresh()
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${withRedirect('/auth/callback', redirect)}` },
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — cinematic brand visual */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #050810 0%, #0a0f1e 50%, #111d3d 100%)' }}
      >
        {/* Animated orbs */}
        <div
          className="absolute rounded-full pointer-events-none animate-orb-pulse"
          style={{ width: 480, height: 480, top: '-10%', left: '-15%', background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute rounded-full pointer-events-none animate-orb-pulse-2"
          style={{ width: 360, height: 360, bottom: '5%', right: '-10%', background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-gold-500" />
          <span className="font-display text-2xl font-bold text-white">
            Read<span className="text-gold-500">.</span>ify
          </span>
        </Link>

        {/* Quote */}
        <div className="relative z-10">
          <blockquote className="font-display text-3xl font-bold text-white leading-snug mb-6">
            &ldquo;Knowledge is the only asset that{' '}
            <span className="text-gold-gradient">compounds.</span>&rdquo;
          </blockquote>
          <p className="text-sm" style={{ color: 'rgba(249,250,251,0.45)' }}>
            South Africa&rsquo;s premier ebook marketplace — browse, purchase,<br />
            and download instantly in South African Rand.
          </p>

          {/* Trust badges */}
          <div className="flex items-center gap-6 mt-8">
            {[
              { icon: ShieldCheck, label: 'Secure Payments' },
              { icon: Zap,         label: 'Instant Download' },
              { icon: Globe,       label: 'VAT Compliant' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(249,250,251,0.5)' }}>
                <Icon className="w-3.5 h-3.5 text-gold-500" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12"
        style={{ background: 'var(--bg)' }}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <BookOpen className="w-7 h-7 text-gold-500" />
            <span className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>
              Read<span className="text-gold-500">.</span>ify
            </span>
          </Link>

          <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Sign in to access your library and downloads
          </p>

          {/* Google OAuth (needs the provider enabled in Supabase + NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true) */}
          {GOOGLE_AUTH_ENABLED && (<>
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-medium text-sm transition-all hover:opacity-90 mb-6"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
          </>)}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-gold-500 hover:text-gold-400 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in&hellip;</>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href={withRedirect('/auth/register', redirect)} className="text-gold-500 font-semibold hover:text-gold-400 transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
