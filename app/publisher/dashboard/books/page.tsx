import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { formatZAR } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { Book } from '@/types'

async function setBookStatus(formData: FormData) {
  'use server'
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || '')
  if (!id || !['published', 'unpublished'].includes(status)) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/publisher/dashboard/books')

  // Only update books owned by this publisher.
  await supabase
    .from('books')
    .update({ status })
    .eq('id', id)
    .eq('publisher_id', user.id)

  revalidatePath('/publisher/dashboard/books')
  revalidatePath('/publisher/dashboard')
  revalidatePath('/books')
}

const badge: Record<string, { bg: string; border: string; color: string }> = {
  published:   { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: '#4ade80' },
  draft:       { bg: 'rgba(255,255,255,0.06)', border: 'var(--border)',         color: 'var(--text-subtle)' },
  unpublished: { bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.3)',   color: '#facc15' },
  rejected:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: '#f87171' },
}

export default async function PublisherBooksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/publisher/dashboard/books')

  const { data: publisher } = await supabase.from('publishers').select('id, status').eq('id', user.id).single()
  if (!publisher) redirect('/publisher/register')

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('publisher_id', publisher.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>Your Books</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                <Link href="/publisher/dashboard" className="text-gold-500 hover:text-gold-400">Back to dashboard</Link>
              </p>
            </div>
            <Link href="/publisher/dashboard/books/new" className="btn-primary text-sm py-2 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Upload Book
            </Link>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {publisher.status !== 'approved' && (
          <p className="text-sm mb-6" style={{ color: 'var(--text-subtle)' }}>
            Your account is under review. You can publish books once it&apos;s approved.
          </p>
        )}

        {!books || books.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>You haven&apos;t uploaded any books yet.</p>
            <Link href="/publisher/dashboard/books/new" className="btn-primary text-sm">Upload your first book</Link>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {books.map((book: Book) => {
              const style = badge[book.status] || badge.draft
              const canPublish = publisher.status === 'approved' && (book.status === 'draft' || book.status === 'unpublished')
              const canUnpublish = book.status === 'published'
              return (
                <div key={book.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{book.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                      {formatZAR(book.price)} &middot; {book.total_sales || 0} sales
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full self-start sm:self-center"
                    style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color }}>
                    {book.status}
                  </span>
                  {canPublish && (
                    <form action={setBookStatus}>
                      <input type="hidden" name="id" value={book.id} />
                      <input type="hidden" name="status" value="published" />
                      <button type="submit" className="btn-primary text-xs py-1.5 px-3">Publish</button>
                    </form>
                  )}
                  {canUnpublish && (
                    <form action={setBookStatus}>
                      <input type="hidden" name="id" value={book.id} />
                      <input type="hidden" name="status" value="unpublished" />
                      <button type="submit" className="btn-secondary text-xs py-1.5 px-3">Unpublish</button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
