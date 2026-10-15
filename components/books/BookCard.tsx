'use client'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Heart, Eye, Star, Check, BookOpen } from 'lucide-react'
import { useCart } from '@/components/cart/CartProvider'
import { formatZAR } from '@/lib/utils'
import type { Book } from '@/types'

interface BookCardProps {
  book: Book
  showPublisher?: boolean
}

export default function BookCard({ book, showPublisher = false }: BookCardProps) {
  const { addItem, removeItem, isInCart } = useCart()
  const inCart = isInCart(book.id)
  const discount = book.original_price
    ? Math.round(((book.original_price - book.price) / book.original_price) * 100)
    : null

  return (
    <div
      className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.transform = 'translateY(-4px)'
        el.style.borderColor = 'rgba(245,166,35,0.2)'
        el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(245,166,35,0.12)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.transform = 'translateY(0)'
        el.style.borderColor = 'var(--border)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* ── Cover ── */}
      <div className="relative overflow-hidden bg-navy-800" style={{ aspectRatio: '3/4' }}>
        <Link href={`/books/${book.slug}`} tabIndex={-1}>
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: 'linear-gradient(135deg, #0d1530 0%, #1e2f5a 100%)' }}>
              <BookOpen className="w-10 h-10 text-gold-500/40" />
              <span className="text-xs text-white/30 text-center px-3 leading-snug">{book.title}</span>
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {book.featured && (
            <span className="badge-gold text-[10px]">Featured</span>
          )}
          {book.on_sale && discount && (
            <span className="badge-sale text-[10px]">-{discount}%</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(8px)' }}
          aria-label="Add to wishlist"
        >
          <Heart className="w-3.5 h-3.5 text-white/80" />
        </button>

        {/* Quick preview overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-4
                        opacity-0 group-hover:opacity-100 transition-all duration-300"
          style={{ background: 'linear-gradient(to top, rgba(10,15,30,0.7) 0%, transparent 60%)' }}>
          <Link
            href={`/books/${book.slug}`}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full
                       text-white transition-all"
            style={{
              background: 'rgba(245,166,35,0.9)',
              color: '#0a0f1e',
            }}
          >
            <Eye className="w-3 h-3" /> Preview
          </Link>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="p-3.5 flex flex-col flex-1">
        {book.categories && (
          <Link
            href={`/books?category=${book.categories.slug}`}
            className="text-[10px] font-semibold uppercase tracking-widest mb-1 transition-colors"
            style={{ color: '#f5a623' }}
          >
            {book.categories.name}
          </Link>
        )}

        <Link href={`/books/${book.slug}`} className="flex-1">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 mb-1 transition-colors hover:text-gold-400"
            style={{ color: 'var(--text)' }}>
            {book.title}
          </h3>
        </Link>

        {book.author && (
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            by {book.author}
          </p>
        )}

        {showPublisher && book.publishers && (
          <p className="text-xs mb-2" style={{ color: 'var(--text-subtle)' }}>
            {book.publishers.company_name}
          </p>
        )}

        {/* Rating */}
        {book.review_count > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${s <= Math.round(book.rating)
                    ? 'text-gold-500 fill-gold-500'
                    : 'fill-transparent'}`}
                  style={s > Math.round(book.rating) ? { color: 'rgba(255,255,255,0.15)' } : {}}
                />
              ))}
            </div>
            <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
              ({book.review_count})
            </span>
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2.5"
          style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--gold)' }}>
              {formatZAR(book.price)}
            </div>
            {book.original_price && (
              <div className="text-xs line-through" style={{ color: 'var(--text-subtle)' }}>
                {formatZAR(book.original_price)}
              </div>
            )}
          </div>
          <button
            onClick={() => inCart ? removeItem(book.id) : addItem(book)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-200"
            style={inCart
              ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }
              : { background: 'linear-gradient(135deg,#f5a623,#d97706)', color: '#0a0f1e' }
            }
          >
            {inCart
              ? <><Check className="w-3.5 h-3.5" /> Added</>
              : <><ShoppingCart className="w-3.5 h-3.5" /> Add</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
