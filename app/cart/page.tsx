'use client'
import { useCart } from '@/components/cart/CartProvider'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, ShoppingCart, ArrowRight, BookOpen, ShieldCheck, Zap } from 'lucide-react'
import { formatZAR, calculateTotal } from '@/lib/utils'

export default function CartPage() {
  const { items, removeItem, clearCart, subtotal } = useCart()
  const { vat, total } = calculateTotal(subtotal)

  if (items.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div className="text-center py-20 px-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <ShoppingCart className="w-10 h-10" style={{ color: 'var(--text-subtle)' }} />
          </div>
          <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>
            Your cart is empty
          </h2>
          <p className="mb-8 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
            Browse our collection of ebooks and add titles to your cart
          </p>
          <Link href="/books" className="btn-primary">
            Browse Ebooks
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="page-container py-10">
        <h1 className="font-display text-2xl font-bold mb-8" style={{ color: 'var(--text)' }}>
          Shopping Cart{' '}
          <span className="font-normal text-xl" style={{ color: 'var(--text-subtle)' }}>
            ({items.length} item{items.length !== 1 ? 's' : ''})
          </span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart items */}
          <div className="flex-1 space-y-3">
            {items.map(({ book }) => (
              <div
                key={book.id}
                className="flex items-center gap-5 p-5 rounded-2xl transition-all"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {/* Cover */}
                <Link href={`/books/${book.slug}`} className="shrink-0">
                  <div
                    className="w-14 h-[72px] rounded-lg overflow-hidden flex items-center justify-center"
                    style={{ background: 'var(--bg-raised)' }}
                  >
                    {book.cover_url ? (
                      <Image
                        src={book.cover_url}
                        alt={book.title}
                        width={56}
                        height={72}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-6 h-6 text-gold-500/50" />
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/books/${book.slug}`}
                    className="font-semibold line-clamp-2 hover:text-gold-400 transition-colors"
                    style={{ color: 'var(--text)' }}
                  >
                    {book.title}
                  </Link>
                  {book.author && (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      by {book.author}
                    </p>
                  )}
                  <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-subtle)' }}>
                    PDF · Digital Download
                  </p>
                </div>

                {/* Price + remove */}
                <div className="shrink-0 text-right">
                  <div className="font-bold text-lg" style={{ color: 'var(--gold)' }}>
                    {formatZAR(book.price)}
                  </div>
                  {book.original_price && (
                    <div className="text-sm line-through" style={{ color: 'var(--text-subtle)' }}>
                      {formatZAR(book.original_price)}
                    </div>
                  )}
                  <button
                    onClick={() => removeItem(book.id)}
                    className="mt-2 flex items-center gap-1 text-xs transition-colors ml-auto"
                    style={{ color: 'rgba(239,68,68,0.6)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(239,68,68,0.6)')}
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 text-xs transition-colors mt-2 py-1"
              style={{ color: 'var(--text-subtle)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
            >
              <Trash2 className="w-3 h-3" /> Clear all items
            </button>
          </div>

          {/* Order summary */}
          <div className="lg:w-80 shrink-0">
            <div
              className="sticky top-24 rounded-2xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-semibold text-lg mb-5" style={{ color: 'var(--text)' }}>
                Order Summary
              </h2>

              <div className="space-y-3 text-sm mb-5">
                <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>Subtotal ({items.length} items)</span>
                  <span>{formatZAR(subtotal)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>VAT (15%)</span>
                  <span>{formatZAR(vat)}</span>
                </div>
                <div
                  className="flex justify-between font-bold text-base pt-3"
                  style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <span>Total</span>
                  <span style={{ color: 'var(--gold)' }}>{formatZAR(total)}</span>
                </div>
              </div>

              <p className="text-xs mb-5" style={{ color: 'var(--text-subtle)' }}>
                15% VAT is added to the subtotal. Instant PDF download after successful payment.
              </p>

              <Link href="/checkout" className="btn-primary w-full justify-center">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 mt-5">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                  <ShieldCheck className="w-3.5 h-3.5 text-gold-500" /> Secure
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                  <Zap className="w-3.5 h-3.5 text-gold-500" /> Instant
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
