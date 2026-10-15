import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatZAR } from '@/lib/utils'
import { Download, BookOpen, Clock, Check, X, ShoppingBag, Library, User } from 'lucide-react'
import type { Order } from '@/types'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/account')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, books(title, slug, cover_url, author))')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, books(title, slug, cover_url, author, pages, file_format)')
    .eq('buyer_id', user.id)
    .order('purchased_at', { ascending: false })

  const totalSpent = (orders as Order[])?.filter((o) => o.status === 'paid').reduce((s, o) => s + (o.total_amount || 0), 0) || 0
  const initial = (profile?.full_name?.[0] || user.email?.[0] || 'R').toUpperCase()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container py-8">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl"
              style={{ background: 'linear-gradient(135deg, #f5a623, #d97706)', color: '#0a0f1e' }}
            >
              {initial}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>
                {profile?.full_name || 'My Account'}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>{user.email}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-8 mt-6">
            {[
              { label: 'Ebooks Owned', value: purchases?.length || 0 },
              { label: 'Orders',       value: orders?.length || 0 },
              { label: 'Total Spent',  value: formatZAR(totalSpent) },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-6">
                {i > 0 && <div className="w-px h-8 shrink-0" style={{ background: 'var(--border)' }} />}
                <div className="text-center">
                  <div className="font-bold text-xl" style={{ color: 'var(--gold)' }}>{stat.value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-subtle)' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Library */}
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-5" style={{ color: 'var(--text)' }}>
              <Library className="w-5 h-5 text-gold-500" /> My Ebooks ({purchases?.length || 0})
            </h2>

            {!purchases || purchases.length === 0 ? (
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-subtle)' }} />
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>No ebooks yet</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-subtle)' }}>
                  Purchase an ebook to build your library
                </p>
                <Link href="/books" className="btn-primary text-sm">Browse Ebooks</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {(purchases as any[]).map((purchase) => {
                  const book      = purchase.books
                  const remaining = (purchase.max_downloads || 5) - (purchase.download_count || 0)
                  return (
                    <div
                      key={purchase.id}
                      className="flex items-center gap-5 p-5 rounded-2xl"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      {/* Cover */}
                      <div
                        className="w-12 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ background: 'var(--bg-raised)' }}
                      >
                        {book?.cover_url ? (
                          <Image src={book.cover_url} alt={book.title} width={48} height={64} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-gold-500/40" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/books/${book?.slug}`}
                          className="text-sm font-semibold hover:text-gold-400 transition-colors"
                          style={{ color: 'var(--text)' }}
                        >
                          {book?.title}
                        </Link>
                        {book?.author && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>by {book.author}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-subtle)' }}>
                          {book?.pages && <span>{book.pages} pages</span>}
                          {book?.pages && <span>&middot;</span>}
                          <span>{remaining} download{remaining !== 1 ? 's' : ''} remaining</span>
                        </div>
                      </div>

                      {/* Download CTA */}
                      <div className="shrink-0">
                        {remaining <= 0 ? (
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
                            <X className="w-3 h-3" /> Limit reached
                          </span>
                        ) : (
                          <a
                            href={`/api/download/${purchase.download_token}`}
                            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Order history */}
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-5" style={{ color: 'var(--text)' }}>
              <ShoppingBag className="w-5 h-5 text-gold-500" /> Orders
            </h2>

            {!orders || orders.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-subtle)' }}
              >
                No orders yet
              </div>
            ) : (
              <div className="space-y-3">
                {(orders as Order[]).map((order) => {
                  const statusStyle = {
                    paid:    { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)',  color: '#4ade80' },
                    pending: { bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.25)',  color: '#facc15' },
                    failed:  { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  color: '#f87171' },
                  }[order.status] || { bg: 'var(--surface)', border: 'var(--border)', color: 'var(--text-subtle)' }

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl p-4"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs" style={{ color: 'var(--text-subtle)' }}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.color }}
                        >
                          {order.status === 'paid'    && <Check className="w-2.5 h-2.5" />}
                          {order.status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs mb-2" style={{ color: 'var(--text-subtle)' }}>
                        {new Date(order.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="font-bold" style={{ color: 'var(--gold)' }}>{formatZAR(order.total_amount || 0)}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                        {(order.order_items as any[])?.length || 0} item{(order.order_items as any[])?.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Profile card */}
            <div
              className="rounded-2xl p-5 mt-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <User className="w-4 h-4 text-gold-500" />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Account Info</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>Name</span>
                  <p style={{ color: 'var(--text-muted)' }}>{profile?.full_name || '—'}</p>
                </div>
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>Email</span>
                  <p style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                </div>
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>Role</span>
                  <p className="capitalize" style={{ color: 'var(--text-muted)' }}>{profile?.role || 'buyer'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
