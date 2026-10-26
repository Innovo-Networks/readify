'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GOOGLE_AUTH_ENABLED } from '@/lib/payments'
import { safeRedirect, withRedirect } from '@/lib/auth-redirect'
import TurnstileWidget, { TURNSTILE_ENABLED } from '@/components/auth/TurnstileWidget'
import { Loader2, Eye, EyeOff, BookOpen, ShoppingBag, Upload, Check, ShieldCheck, Zap, Globe } from 'lucide-react'

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8)  score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score, label: 'Weak',   color: '#ef4444' }
  if (score === 2) return { score, label: 'Fair',   color: '#f97316' }
  if (score === 3) return { score, label: 'Good',   color: '#eab308' }
  return             { score, label: 'Strong', color: '#22c55e' }
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Where to land once the account is confirmed (e.g. /checkout when sent here from the cart).
  const redirect = safeRedirect(searchParams.get('redirect'))
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [role, setRole] = useState<'buyer' | 'publisher'>('buyer')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [terms, setTerms] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const supabase = createClient()
  const pwStrength = getPasswordStrength(form.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!terms) { setError('Please accept the Terms of Service to continue'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (TURNSTILE_ENABLED && !captchaToken) { setError('Please complete the security check'); return }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        captchaToken: captchaToken ?? undefined,
        data: { full_name: form.name, role },
        // Send the confirmation link back to whichever host the user signed up on
        // (production, a Vercel preview, or localhost) instead of the Supabase Site URL.
        // Publisher sign-ups continue to the publisher application once the email is confirmed.
        emailRedirectTo: `${window.location.origin}${withRedirect('/auth/callback', role === 'publisher' ? '/publisher/register' : redirect)}`,
      },
    })
    setCaptchaKey((k) => k + 1)
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${withRedirect('/auth/callback', redirect)}` },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}
          >
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--text)' }}>
            Check your email
          </h2>
          <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
            We&rsquo;ve sent a confirmation link to <strong style={{ color: 'var(--gold)' }}>{form.email}</strong>.
            Click the link to activate your Readify account and start{' '}
            {role === 'publisher' ? 'selling ebooks' : 'reading'}.
          </p>
          <Link href={withRedirect('/auth/login', redirect)} className="btn-primary">
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — cinematic brand visual */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #050810 0%, #0a0f1e 50%, #111d3d 100%)' }}
      >
        <div
          className="absolute rounded-full pointer-events-none animate-orb-pulse"
          style={{ width: 480, height: 480, top: '-10%', left: '-15%', background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute rounded-full pointer-events-none animate-orb-pulse-2"
          style={{ width: 360, height: 360, bottom: '5%', right: '-10%', background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)' }}
        />

        <Link href="/" className="relative z-10 flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-gold-500" />
          <span className="font-display text-2xl font-bold text-white">
            Read<span className="text-gold-500">.</span>ify
          </span>
        </Link>

        <div className="relative z-10">
          <blockquote className="font-display text-3xl font-bold text-white leading-snug mb-6">
            &ldquo;Every great reader was once a{' '}
            <span className="text-gold-gradient">first-time buyer.</span>&rdquo;
          </blockquote>
          <p className="text-sm mb-8" style={{ color: 'rgba(249,250,251,0.45)' }}>
            Join thousands of South African readers and publishers on Readify —
            the marketplace built for the knowledge economy.
          </p>

          <div className="space-y-3">
            {[
              { icon: ShoppingBag, title: 'For Buyers', desc: 'Browse 1,000+ titles, pay in Rand, download instantly' },
              { icon: Upload, title: 'For Publishers', desc: 'Upload, price, and sell your ebooks — keep 80% revenue' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 glass-card p-3 rounded-xl">
                <Icon className="w-5 h-5 text-gold-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="text-xs" style={{ color: 'rgba(249,250,251,0.5)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 mt-6">
            {[
              { icon: ShieldCheck, label: 'Secure' },
              { icon: Zap,         label: 'Instant' },
              { icon: Globe,       label: 'VAT Ready' },
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
        className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10"
        style={{ background: 'var(--bg)' }}
      >
        <div className="w-full max-w-md">
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <BookOpen className="w-7 h-7 text-gold-500" />
            <span className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>
              Read<span className="text-gold-500">.</span>ify
            </span>
          </Link>

          <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>
            Create your account
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Start reading and selling ebooks today
          </p>

          {/* Google OAuth (needs the provider enabled in Supabase + NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true) */}
          {GOOGLE_AUTH_ENABLED && (<>
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-medium text-sm transition-all hover:opacity-90 mb-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>or create with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
          </>)}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                I want to…
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'buyer',     icon: ShoppingBag, title: 'Buy Ebooks',   desc: 'Browse & download' },
                  { value: 'publisher', icon: Upload,       title: 'Sell Ebooks',  desc: 'Publish & earn' },
                ] as const).map(({ value, icon: Icon, title, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center"
                    style={{
                      background: role === value ? 'rgba(245,166,35,0.08)' : 'var(--surface)',
                      border: role === value ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: role === value ? 'var(--gold)' : 'var(--text-subtle)' }}
                    />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</div>
                      <div className="text-xs" style={{ color: 'var(--text-subtle)' }}>{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Full Name</label>
              <input className="input" placeholder="John Smith" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email Address</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-subtle)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: pwStrength.score >= i ? pwStrength.color : 'var(--border)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: pwStrength.color }}>{pwStrength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Confirm Password</label>
              <input type="password" className="input" placeholder="Repeat password" value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                {error}
              </div>
            )}

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
                <div
                  className="w-4 h-4 rounded flex items-center justify-center transition-all"
                  style={{
                    background: terms ? 'var(--gold)' : 'var(--surface)',
                    border: terms ? '1.5px solid var(--gold)' : '1.5px solid var(--border)',
                  }}
                >
                  {terms && <Check className="w-2.5 h-2.5 text-navy-900" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                I agree to the{' '}
                <Link href="/terms" className="text-gold-500 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-gold-500 hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaKey} />

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account&hellip;</>
              ) : `Create ${role === 'publisher' ? 'Publisher' : ''} Account`}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href={withRedirect('/auth/login', redirect)} className="text-gold-500 font-semibold hover:text-gold-400 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}
