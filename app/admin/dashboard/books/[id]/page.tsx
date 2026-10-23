import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, Check, X, FileText } from 'lucide-react'
import { formatZAR } from '@/lib/utils'
import type { Book } from '@/types'

async function setStatus(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  await supabase.from('books').update({ status }).eq('id', id)
  revalidatePath(`/admin/dashboard/books/${id}`)
  revalidatePath('/admin/dashboard/books')
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-subtle)' }}>{label}</p>
      <p className="text-sm break-words" style={{ color: 'var(--text)' }}>{value || '—'}</p>
    </div>
  )
}

export default async function AdminBookReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: book } = await supabase
    .from('books')
    .select('*, publishers(company_name, status, profiles(email)), categories(name)')
    .eq('id', id)
    .single()
  if (!book) notFound()
  const b = book as Book & { publishers?: any; categories?: any }

  const coverUrl = b.cover_url
  const statusColour: Record<string, string> = {
    published: '#4ade80', draft: 'var(--text-subtle)', unpublished: '#facc15', rejected: '#f87171',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container py-6 flex items-center gap-4">
          <Link href="/admin/dashboard/books" className="transition-colors hover:text-gold-400" style={{ color: 'var(--text-subtle)' }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>Review: {b.title}</h1>
        </div>
      </div>

      <div className="page-container py-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={`Cover of ${b.title}`} className="w-full rounded-xl" style={{ border: '1px solid var(--border)' }} />
          ) : (
            <div className="w-full aspect-[2/3] rounded-xl flex items-center justify-center text-sm" style={{ border: '1px dashed var(--border)', color: 'var(--text-subtle)' }}>
              No cover uploaded
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Link href={`/api/admin/books/${b.id}/ebook`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-3 inline-flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Open uploaded file
            </Link>
            {b.sample_url && (
              <a href={b.sample_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-3 inline-flex items-center justify-center gap-2">
                Open sample
              </a>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl p-6 grid gap-6 sm:grid-cols-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Field label="Title" value={b.title} />
            <Field label="Subtitle" value={b.subtitle} />
            <Field label="Author" value={b.author} />
            <Field label="Publisher" value={`${b.publishers?.company_name ?? '—'} (${b.publishers?.status ?? 'unknown'})`} />
            <Field label="Publisher email" value={b.publishers?.profiles?.email} />
            <Field label="Category" value={b.categories?.name} />
            <Field label="Language" value={b.language} />
            <Field label="Pages" value={b.pages} />
            <Field label="ISBN" value={b.isbn} />
            <Field label="Publication date" value={b.publication_date} />
            <Field label="Price" value={formatZAR(b.price)} />
            <Field label="Original price" value={b.original_price != null ? formatZAR(b.original_price) : null} />
            <Field label="Tags" value={(b.tags ?? []).join(', ')} />
            <Field label="Status" value={<span style={{ color: statusColour[b.status] }}>{b.status}</span>} />
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-subtle)' }}>Description</p>
            <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text)' }}>{b.description || '—'}</p>
          </div>

          <div className="rounded-2xl p-6 flex flex-wrap gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {b.status !== 'published' && (
              <form action={setStatus}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="status" value="published" />
                <button type="submit" className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2"><Check className="w-4 h-4" /> Approve and publish</button>
              </form>
            )}
            {b.status !== 'rejected' && (
              <form action={setStatus}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="status" value="rejected" />
                <button type="submit" className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-2" style={{ color: '#f87171' }}><X className="w-4 h-4" /> Reject</button>
              </form>
            )}
            {b.status === 'published' && (
              <form action={setStatus}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="status" value="unpublished" />
                <button type="submit" className="btn-secondary text-sm py-2 px-4">Unpublish</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
