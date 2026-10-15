import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatZAR } from '@/lib/utils'
import { BookOpen, TrendingUp, DollarSign, Star, Plus, Eye, Clock, Check, ArrowUpRight, Banknote } from 'lucide-react'
import type { Book } from '@/types'

export default async function PublisherDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/publisher/dashboard')

  const { data: publisher } = await supabase.from('publishers').select('*').eq('user_id', user.id).single()
  if (!publisher) redirect('/publisher/register')

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('publisher_id', publisher.id)
    .order('created_at', { ascending: false })

  const { data: recentOrders } = await supabase
    .from('order_items')
    .select('*, orders(created_at, status), books(title)')
    .eq('publisher_id', publisher.id)
    .order('created_at', { ascending: false })
    .limit(8)

  const totalBooks     = books?.length || 0
  const publishedBooks = books?.filter((b: Book) => b.status === 'published').length || 0
  const totalSales     = books?.reduce((s: number, b: Book) => s + (b.total_sales || 0), 0) || 0
  const totalRevenue   = publisher.total_earnings || 0
  const commission     = totalRevenue * ((publisher.commission_rate || 20) / 100)
  const netEarnings    = totalRevenue - commission

  const isPending  = publisher.status === 'pending'
  const isApproved = publisher.status === 'approved'

  const statusBadge = {
    approved:  { label: 'Approved',      bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  color: '#4ade80' },
    pending:   { label: 'Under Review',  bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)',  color: '#facc15' },
    suspended: { label: 'Suspended',     bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#f87171' },
  }[publisher.status] || { label: publisher.status, bg: 'var(--surface)', border: 'var(--border)', color: 'var(--text-muted)' }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>
                {publisher.company_name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-subtle)' }}>Publisher Dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: statusBadge.bg, border: `1px solid ${statusBadge.border}`, color: statusBadge.color }}
              >
                {isApproved && <Check className="w-3 h-3 inline mr-1" />}
                {statusBadge.label}
              </span>
              {isApproved && (
                <Link href="/publisher/dashboard/books/new" className="btn-primary text-sm py-2">
                  <Plus className="w-4 h-4" /> Upload Book
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Pending notice */}
        {isPending && (
          <div
            className="rounded-2xl p-5 mb-8 flex items-start gap-4"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)' }}
          >
            <Clock className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-300">Application Under Review</h3>
              <p className="text-sm mt-1" style={{ color: 'rgba(253,224,71,0.7)' }}>
                Your publisher application is being reviewed. You&rsquo;ll receive an email within 2–3 business days.
                Once approved, you can start uploading and selling ebooks.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Books',    value: String(totalBooks),      sub: `${publishedBooks} published`, icon: BookOpen,   color: 'text-gold-500',   bg: 'rgba(245,166,35,0.1)'  },
            { label: 'Total Sales',    value: String(totalSales),      sub: 'copies sold',                icon: TrendingUp, color: 'text-green-400',  bg: 'rgba(34,197,94,0.1)'   },
            { label: 'Gross Revenue',  value: formatZAR(totalRevenue), sub: 'before commission',          icon: DollarSign, color: 'text-blue-400',   bg: 'rgba(96,165,250,0.1)'  },
            { label: 'Net Earnings',   value: formatZAR(netEarnings),  sub: `${100 - (publisher.commission_rate || 20)}% of sales`, icon: Star, color: 'text-gold-400', bg: 'rgba(245,166,35,0.08)' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-2xl p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`} style={{ background: stat.bg }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{stat.value}</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{stat.sub}</div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Books table */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Your Books</h2>
                <Link href="/publisher/dashboard/books" className="text-xs flex items-center gap-1 text-gold-500 hover:text-gold-400 transition-colors">
                  View all <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              {!books || books.length === 0 ? (
                <div className="p-10 text-center">
                  <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
                  <p className="text-sm mb-4" style={{ color: 'var(--text-subtle)' }}>No books yet</p>
                  {isApproved && (
                    <Link href="/publisher/dashboard/books/new" className="btn-primary text-sm">
                      Upload Your First Book
                    </Link>
                  )}
                </div>
              ) : (
                <div>
                  {books.slice(0, 6).map((book: Book) => (
                    <div
                      key={book.id}
                      className="flex items-center gap-4 p-4 transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div
                        className="w-10 h-12 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ background: 'var(--bg-raised)' }}
                      >
                        <BookOpen className="w-4 h-4 text-gold-500/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{book.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                          {formatZAR(book.price)} &middot; {book.total_sales || 0} sales
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: book.status === 'published' ? 'rgba(34,197,94,0.1)' : book.status === 'draft' ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.1)',
                            color:      book.status === 'published' ? '#4ade80' : book.status === 'draft' ? 'var(--text-subtle)' : '#f87171',
                          }}
                        >
                          {book.status}
                        </span>
                        <Link href={`/books/${book.slug}`} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-subtle)' }}>
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Recent sales */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Recent Sales</h2>
              </div>
              {!recentOrders || recentOrders.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--text-subtle)' }}>No sales yet</div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {(recentOrders as any[]).map((item) => (
                    <div key={item.id} className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-muted)' }}>{item.books?.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                          {item.orders?.created_at && new Date(item.orders.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs font-semibold text-green-400">{formatZAR(item.publisher_earnings || item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Earnings card */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(217,119,6,0.1) 100%)', border: '1px solid rgba(245,166,35,0.25)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="w-4 h-4 text-gold-500" />
                <h3 className="font-semibold text-sm" style={{ color: 'var(--gold)' }}>Earnings Summary</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-subtle)' }}>
                Payouts processed on the 1st of each month
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Gross Revenue</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{formatZAR(totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Platform Fee ({publisher.commission_rate || 20}%)</span>
                  <span className="font-semibold text-red-400">−{formatZAR(commission)}</span>
                </div>
                <div
                  className="flex justify-between font-bold pt-2"
                  style={{ borderTop: '1px solid rgba(245,166,35,0.2)', color: 'var(--gold)' }}
                >
                  <span>Your Payout</span>
                  <span>{formatZAR(netEarnings)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
