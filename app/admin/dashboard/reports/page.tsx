import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Report = {
  id: string
  reason: string
  reporter_name: string
  reporter_email: string
  details: string | null
  status: 'open' | 'resolved' | 'dismissed'
  created_at: string
  books: { title: string; slug: string } | null
}

const reasonLabel: Record<string, string> = {
  copyright: 'Copyright',
  misattributed: 'Wrong author/publisher',
  offensive: 'Offensive',
  misleading: 'Misleading',
  other: 'Other',
}

async function updateReportStatus(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  if (!['open', 'resolved', 'dismissed'].includes(status)) return
  // RLS only lets admins update reports.
  await supabase.from('book_reports').update({ status }).eq('id', id)
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const params = await searchParams
  const filter = params.status || 'open'

  let query = supabase
    .from('book_reports')
    .select('id, reason, reporter_name, reporter_email, details, status, created_at, books(title, slug)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (filter !== 'all') query = query.eq('status', filter)

  const { data } = await query
  const reports = (data as unknown as Report[]) || []

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container py-6 flex items-center gap-4">
          <Link href="/admin/dashboard" className="transition-colors hover:text-gold-400" style={{ color: 'var(--text-subtle)' }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Book Reports ({reports.length})
          </h1>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          {['open', 'resolved', 'dismissed', 'all'].map((s) => {
            const active = filter === s
            return (
              <Link
                key={s}
                href={`/admin/dashboard/reports?status=${s}`}
                className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors"
                style={
                  active
                    ? { background: 'linear-gradient(135deg, #f5a623, #d4861a)', color: '#0a0a0a' }
                    : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {s}
              </Link>
            )
          })}
        </div>

        <div className="space-y-4">
          {reports.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>No reports match this filter.</p>
          )}
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text)' }}>
                    {r.books ? (
                      <Link href={`/books/${r.books.slug}`} className="hover:underline">{r.books.title}</Link>
                    ) : 'Book removed'}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {reasonLabel[r.reason] ?? r.reason} · {new Date(r.created_at).toLocaleString('en-ZA')}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    From {r.reporter_name} ({r.reporter_email})
                  </p>
                  {r.details && (
                    <p className="text-sm mt-3 whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{r.details}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status !== 'resolved' && (
                    <form action={updateReportStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="resolved" />
                      <button className="btn-secondary text-sm py-2">Mark resolved</button>
                    </form>
                  )}
                  {r.status !== 'dismissed' && (
                    <form action={updateReportStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="dismissed" />
                      <button className="btn-secondary text-sm py-2">Dismiss</button>
                    </form>
                  )}
                  {r.status !== 'open' && (
                    <form action={updateReportStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="open" />
                      <button className="btn-secondary text-sm py-2">Reopen</button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
