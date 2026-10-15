import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, Check, X } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-5 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Book Management ({count || 0})</h1>
            <form method="GET" className="flex gap-2">
              <input name="q" defaultValue={params.q} placeholder="Search books…" className="input text-sm py-2 w-48" />
              <input type="hidden" name="status" value={filter} />
            </form>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Status filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'published', 'draft', 'unpublished', 'rejected'].map((s) => (
            <Link
              key={s}
              href={`/admin/dashboard/books?status=${s}${params.q ? `&q=${params.q}` : ''}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${filter === s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'}`}
            >
              {s}
            </Link>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Book</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Publisher</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(books as Book[])?.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{book.title}</p>
                        <p className="text-xs text-gray-400">{(book.categories as any)?.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600 truncate max-w-[120px]">{(book.publishers as any)?.company_name}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{formatZAR(book.price)}</td>
                    <td className="px-4 py-4">
                      <span className={`badge text-xs ${
                        book.status === 'published' ? 'bg-green-100 text-green-700' :
                        book.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                        book.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {book.status}
                      </span>
                      {book.featured && <span className="ml-1 badge bg-gold-100 text-gold-700 text-xs">⭐</span>}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{book.total_sales}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/books/${book.slug}`} target="_blank" className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {book.status === 'draft' && (
                          <form action={updateBookStatus}>
                            <input type="hidden" name="id" value={book.id} />
                            <input type="hidden" name="status" value="published" />
                            <button className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Publish">
                              <Check className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                        {book.status === 'published' && (
                          <form action={updateBookStatus}>
                            <input type="hidden" name="id" value={book.id} />
                            <input type="hidden" name="status" value="unpublished" />
                            <button className="p-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors" title="Unpublish">
                              <X className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                        <form action={toggleFeatured}>
                          <input type="hidden" name="id" value={book.id} />
                          <input type="hidden" name="featured" value={String(book.featured)} />
                          <button className={`p-1.5 rounded-lg transition-colors text-xs font-bold ${book.featured ? 'bg-gold-100 text-gold-700 hover:bg-gold-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`} title="Toggle Featured">
                            ⭐
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
