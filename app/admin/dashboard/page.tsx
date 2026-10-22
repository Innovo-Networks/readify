import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatZAR } from '@/lib/utils'
import { Users, BookOpen, ShoppingBag, DollarSign, Clock, Check, X, AlertTriangle, ArrowUpRight } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const [
    { count: totalUsers },
    { count: totalPublishers },
    { count: pendingPublishers },
    { count: totalBooks },
    { count: pendingBooks },
    { data: recentOrders },
    { data: pendingPublisherList },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('publishers').select('*', { count: 'exact', head: true }),
    supabase.from('publishers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('books').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('orders').select('id, status, total, created_at, payment_method').order('created_at', { ascending: false }).limit(10),
    supabase.from('publishers').select('id, company_name, phone, vat_number, created_at, profiles(email, full_name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
  ])

  const { data: revenueData } = await supabase.from('orders').select('total').eq('status', 'paid')
  const totalRevenue = revenueData?.reduce((s, o) => s + (o.total || 0), 0) || 0

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container py-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>Admin Dashboard</h1>
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>Readify Platform Management</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/dashboard/publishers" className="btn-secondary text-sm py-2">
              Publishers
            </Link>
            <Link href="/admin/dashboard/books" className="btn-secondary text-sm py-2">
              Books
            </Link>
            <Link href="/admin/dashboard/reports" className="btn-secondary text-sm py-2">
              Reports
            </Link>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users',    value: String(totalUsers || 0),                                icon: Users,      color: 'text-blue-400',   bg: 'rgba(96,165,250,0.1)'  },
            { label: 'Publishers',     value: `${totalPublishers || 0}`,  sub: `${pendingPublishers || 0} pending`, icon: BookOpen,   color: 'text-purple-400', bg: 'rgba(192,132,252,0.1)' },
            { label: 'Total Books',    value: `${totalBooks || 0}`,       sub: `${pendingBooks || 0} drafts`,       icon: BookOpen,   color: 'text-green-400',  bg: 'rgba(34,197,94,0.1)'   },
            { label: 'Total Revenue',  value: formatZAR(totalRevenue),                               icon: DollarSign, color: 'text-gold-500',   bg: 'rgba(245,166,35,0.1)'  },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`} style={{ background: s.bg }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{s.value}</div>
                {s.sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{s.sub}</div>}
                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            )
          })}
        </div>

        {/* Pending alert */}
        {(pendingPublishers || 0) > 0 && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)' }}
          >
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-sm" style={{ color: 'rgba(253,224,71,0.85)' }}>
              <strong>{pendingPublishers} publisher application{pendingPublishers !== 1 ? 's' : ''}</strong> awaiting review.
              <Link href="/admin/dashboard/publishers" className="ml-2 text-gold-400 underline font-medium">Review now →</Link>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending publishers */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-semibold flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
                <Clock className="w-4 h-4 text-yellow-400" /> Pending Applications
              </h2>
              <Link href="/admin/dashboard/publishers" className="text-xs flex items-center gap-1 text-gold-500 hover:text-gold-400 transition-colors">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {!pendingPublisherList || pendingPublisherList.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--text-subtle)' }}>
                No pending applications
              </div>
            ) : (
              <div>
                {pendingPublisherList.map((pub: any) => (
                  <div key={pub.id} className="flex items-center gap-4 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--gold)' }}
                    >
                      {pub.company_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{pub.company_name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-subtle)' }}>{(pub.profiles as any)?.email}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <form action={async () => {
                        'use server'
                        const sb = await createClient()
                        await sb.from('publishers').update({ status: 'approved' }).eq('id', pub.id)
                      }}>
                        <button
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </form>
                      <form action={async () => {
                        'use server'
                        const sb = await createClient()
                        await sb.from('publishers').update({ status: 'suspended' }).eq('id', pub.id)
                      }}>
                        <button
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-semibold flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
                <ShoppingBag className="w-4 h-4 text-gold-500" /> Recent Orders
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(recentOrders || []).map((order: any) => {
                const statusColor = order.status === 'paid' ? '#4ade80' : order.status === 'pending' ? '#facc15' : '#f87171'
                return (
                  <div key={order.id} className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs capitalize" style={{ color: 'var(--text-subtle)' }}>{order.payment_method}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>{formatZAR(order.total || 0)}</p>
                      <p className="text-xs capitalize" style={{ color: statusColor }}>{order.status}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
