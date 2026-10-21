import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, Check, X, Star } from 'lucide-react'
import { formatZAR } from '@/lib/utils'
import type { Book } from '@/types'

async function updateBookStatus(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  await supabase.from('books').update({ status }).eq('id', id)
}

async function toggleFeatured(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  const featured = formData.get('featured') === 'true'
  await supabase.from('books').update({ featured: !featured }).eq('id', id)
}

const statusStyle: Record<string, { bg: string; border: string; color: string }> = {
  published:   { bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.3)',    color: '#4ade80' },
  draft:       { bg: 'rgba(255,255,255,0.06)', border: 'var(--border)',          color: 'var(--text-subtle)' },
  unpublished: { bg: 'rgba(234,179,8,0.1)',    border: 'rgba(234,179,8,0.3)',    color: '#facc15' },
  rejected:    { bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)',    color: '#f87171' },
}

const thStyle = { color: 'var(--text-subtle)' }

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const params = await searchParams
  const filter = params.status || 'all'

  let query = supabase
    .from('books')
    .select('*, publishers(company_name), categories(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  if (filter !== 'all') query = query.eq('status', filter)
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const { data: books, count } = await query

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container py-6 flex items-center gap-4">
          <Link href="/admin/dashboard" className="transition-colors hover:text-gold-400" style={{ color: 'var(--text-subtle)' }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Book Management ({count || 0})
            </h1>
            <form method="GET" className="flex gap-2">
              <input name="q" defaultValue={params.q} placeholder="Search books…" className="input text-sm py-2 w-56" />
              <input type="hidden" name="status" value={filter} />
            </form>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Status filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'published', 'draft', 'unpublished', 'rejected'].map((s) => {
            const active = filter === s
            return (
              <Link
                key={s}
                href={`/admin/dashboard/books?status=${s}${params.q ? `&q=${params.q}` : ''}`}
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

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={thStyle}>Book</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={thStyle}>Publisher</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={thStyle}>Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={thStyle}>Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={thStyle}>Sales</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(books as Book[])?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center" style={{ color: 'var(--text-subtle)' }}>
                      No books match this filter.
                    </td>
                  </tr>
                )}
                {(books as Book[])?.map((book) => {
                  const style = statusStyle[book.status] || statusStyle.draft
                  return (
                    <tr key={book.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        <div className="max-w-xs">
                          <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{book.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{(book.categories as any)?.name || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="truncate max-w-[160px]" style={{ color: 'var(--text-muted)' }}>
                          {(book.publishers as any)?.company_name || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
                        {book.price != null ? formatZAR(book.price) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                          style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color }}>
                          {book.status}
                        </span>
                        {book.featured && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-gold-400">
                            <Star className="w-3 h-3 fill-current" /> Featured
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4" style={{ color: 'var(--text-muted)' }}>{book.total_sales ?? 0}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Link href={`/books/${book.slug}`} target="_blank" className="p-2 rounded-lg transition-colors hover:text-gold-400" style={{ color: 'var(--text-subtle)' }} title="View on site">
                            <Eye className="w-4 h-4" />
                          </Link>
                          {book.status === 'draft' && (
                            <form action={updateBookStatus}>
                              <input type="hidden" name="id" value={book.id} />
                              <input type="hidden" name="status" value="published" />
                              <button type="submit" className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Publish
                              </button>
                            </form>
                          )}
                          {book.status === 'published' && (
                            <form action={updateBookStatus}>
                              <input type="hidden" name="id" value={book.id} />
                              <input type="hidden" name="status" value="unpublished" />
                              <button type="submit" className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1">
                                <X className="w-3.5 h-3.5" /> Unpublish
                              </button>
                            </form>
                          )}
                          <form action={toggleFeatured}>
                            <input type="hidden" name="id" value={book.id} />
                            <input type="hidden" name="featured" value={String(book.featured)} />
                            <button type="submit" className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1">
                              <Star className={`w-3.5 h-3.5 ${book.featured ? 'fill-current text-gold-400' : ''}`} />
                              {book.featured ? 'Unfeature' : 'Feature'}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
