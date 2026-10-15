'use client'
import { useCart } from '@/components/cart/CartProvider'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatZAR, calculateTotal, applyPromotion } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ENABLED_PAYMENT_METHODS, isSeedBookId, type PaymentMethod } from '@/lib/payments'
import { CreditCard, Bitcoin, ArrowLeft, Tag, Loader2, ShieldCheck, BookOpen, Wallet, Banknote } from 'lucide-react'

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const router  = useRouter()
  const [method,       setMethod]       = useState<PaymentMethod>(ENABLED_PAYMENT_METHODS[0])
  const [loading,      setLoading]      = useState(false)
  const [promoCode,    setPromoCode]    = useState('')
  const [promoApplied, setPromoApplied] = useState<{ name: string; discount: number } | null>(null)
  const [promoError,   setPromoError]   = useState('')
  const [form,         setForm]         = useState({ name: '', email: '' })
  const [errors,       setErrors]       = useState<Record<string, string>>({})

  const discount     = promoApplied?.discount || 0
  const { vat, total } = calculateTotal(subtotal, discount)

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoError('')
    const supabase = createClient()
    const { data: promo } = await supabase
      .from('promotions').select('*')
      .eq('code', promoCode.toUpperCase().trim())
      .eq('is_active', true).single()

    if (!promo) { setPromoError('Invalid or expired promo code'); return }
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) { setPromoError('This promo code has expired'); return }
    if (promo.max_uses && promo.used_count >= promo.max_uses) { setPromoError('This code has reached its limit'); return }
    const disc = applyPromotion(subtotal, promo)
    setPromoApplied({ name: promo.name, discount: disc })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())  e.name  = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCheckout = async () => {
    if (!validate()) return
    if (items.length === 0) { router.push('/books'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Downloads are tied to an account, so guests sign in (or register) before paying.
      if (!user) { router.push('/auth/login?redirect=/checkout'); return }

      if (items.some((i) => isSeedBookId(i.book.id))) {
        throw new Error('Demo catalogue titles cannot be purchased yet. Please choose a title published by a publisher.')
      }

      const { data: order, error } = await supabase.from('orders').insert({
        buyer_id:       user?.id || null,
        buyer_name:     form.name,
        buyer_email:    form.email,
        subtotal,
        discount,
        vat_amount:     vat,
        vat_rate:       15,
        total,
        currency:       'ZAR',
        payment_method: method,
        promotion_code: promoApplied ? promoCode.toUpperCase().trim() : null,
        status:         'pending',
      }).select().single()

      if (error || !order) throw new Error('Failed to create order')

      const { error: itemsError } = await supabase.from('order_items').insert(
        items.map((i) => ({
          order_id:     order.id,
          book_id:      i.book.id,
          publisher_id: i.book.publisher_id,
          title:        i.book.title,
          cover_url:    i.book.cover_url,
          price:        i.book.price,
        }))
      )
      if (itemsError) throw new Error('Could not add the books to your order. Please try again.')

      if (method === 'payfast') {
        const res = await fetch('/api/payfast/create-payment', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        })
        const data = await res.json()
        if (!res.ok || !data.url || !data.fields) throw new Error(data.error || 'PayFast could not be started. Please try again later.')
        // PayFast expects a form POST to its hosted page.
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.url
        for (const [name, value] of Object.entries(data.fields as Record<string, string>)) {
          const input = document.createElement('input')
          input.type = 'hidden'; input.name = name; input.value = value
          form.appendChild(input)
        }
        document.body.appendChild(form)
        form.submit()
        return
      } else if (method === 'stripe') {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, items: items.map((i) => ({ title: i.book.title, price: i.book.price, quantity: 1 })), buyerEmail: form.email }),
        })
        const data = await res.json()
        if (!res.ok || !data.url) throw new Error(data.error || 'Card payment could not be started. Please try again later.')
        window.location.href = data.url
      } else if (method === 'paypal') {
        const res = await fetch('/api/paypal/create-order', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, total }),
        })
        const data = await res.json()
        if (!res.ok || !data.approvalUrl) throw new Error(data.error || 'PayPal could not be started. Please try again later.')
        window.location.href = data.approvalUrl
      } else if (method === 'coinbase') {
        const res = await fetch('/api/coinbase/create-charge', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, total, buyerName: form.name, buyerEmail: form.email, description: `Readify: ${items.length} ebook(s)` }),
        })
        const data = await res.json()
        if (!res.ok || !data.hostedUrl) throw new Error(data.error || 'Crypto payment could not be started. Please try again later.')
        window.location.href = data.hostedUrl
      }
    } catch (e: any) {
      setErrors({ general: e?.message || 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>Your cart is empty</p>
          <Link href="/books" className="btn-primary">Browse Books</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="page-container py-10">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: 'var(--text-subtle)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
        >
          <ArrowLeft className="w-4 h-4" /> Back to cart
        </Link>

        <h1 className="font-display text-2xl font-bold mb-8" style={{ color: 'var(--text)' }}>
          Checkout
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Form */}
          <div className="flex-1 space-y-5">
            {/* Contact info */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Your Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Full Name *</label>
                  <input className="input" placeholder="John Smith" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email Address *</label>
                  <input type="email" className="input" placeholder="john@example.com" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                </div>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-subtle)' }}>
                Download links will be sent to this email after payment.
              </p>
            </div>

            {/* Promo code */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Promo Code</h2>
              {promoApplied ? (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <Tag className="w-4 h-4 text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-400">{promoApplied.name}</p>
                    <p className="text-xs text-green-500">Saving {formatZAR(promoApplied.discount)}</p>
                  </div>
                  <button onClick={() => { setPromoApplied(null); setPromoCode('') }} className="text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="Enter promo code" value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
                  <button onClick={applyPromo} className="btn-secondary text-sm shrink-0 px-4">Apply</button>
                </div>
              )}
              {promoError && <p className="text-xs text-red-400 mt-2">{promoError}</p>}
            </div>

            {/* Payment method */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Payment Method</h2>
              <div className="space-y-3">
                {([
                  { id: 'payfast',  label: 'PayFast',               sub: 'Card, Instant EFT, SnapScan, Zapper, Mobicred', icon: Banknote, badge: 'South Africa', color: 'text-emerald-400' },
                { id: 'stripe',   label: 'Credit / Debit Card',   sub: 'Visa, Mastercard · powered by Stripe', icon: CreditCard, badge: null,          color: 'text-blue-400' },
                  { id: 'paypal',   label: 'PayPal',                sub: 'Pay with your PayPal account',        icon: Wallet,     badge: null,          color: 'text-blue-500' },
                  { id: 'coinbase', label: 'Cryptocurrency',         sub: 'Bitcoin, Ethereum, USDC and more',   icon: Bitcoin,    badge: 'New',         color: 'text-orange-400' },
                ] as const).filter((pm) => ENABLED_PAYMENT_METHODS.includes(pm.id)).map((pm) => {
                  const active = method === pm.id
                  const Icon   = pm.icon
                  return (
                    <label
                      key={pm.id}
                      className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        border:     active ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                        background: active ? 'rgba(245,166,35,0.05)' : 'transparent',
                      }}
                      onClick={() => setMethod(pm.id)}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: active ? 'var(--gold)' : 'var(--border)' }}
                      >
                        {active && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />}
                      </div>
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pm.color}`}
                        style={{ background: active ? 'rgba(245,166,35,0.1)' : 'var(--bg-raised)' }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                          {pm.label}
                          {pm.badge && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--gold)', fontSize: '10px' }}
                            >
                              {pm.badge}
                            </span>
                          )}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{pm.sub}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {errors.general && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                {errors.general}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary w-full justify-center text-base py-4"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
              ) : (
                `Pay ${formatZAR(total)}`
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
              <ShieldCheck className="w-4 h-4 text-green-400" />
              SSL encrypted · PCI DSS compliant · Instant delivery
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="lg:w-80 shrink-0">
            <div
              className="sticky top-24 rounded-2xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Order Summary</h2>
              <div className="space-y-3 mb-5">
                {items.map(({ book }) => (
                  <div key={book.id} className="flex items-center gap-3">
                    <div
                      className="w-10 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: 'var(--bg-raised)' }}
                    >
                      {book.cover_url ? (
                        <Image src={book.cover_url} alt={book.title} width={40} height={48} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-gold-500/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2" style={{ color: 'var(--text-muted)' }}>{book.title}</p>
                    </div>
                    <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--gold)' }}>{formatZAR(book.price)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>Subtotal</span><span>{formatZAR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span><span>−{formatZAR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>VAT (15%)</span><span>{formatZAR(vat)}</span>
                </div>
                <div
                  className="flex justify-between font-bold text-base pt-2"
                  style={{ borderTop: '1px solid var(--border)', color: 'var(--gold)' }}
                >
                  <span style={{ color: 'var(--text)' }}>Total</span>
                  <span>{formatZAR(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
