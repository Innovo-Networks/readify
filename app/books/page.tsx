import { createClient } from '@/lib/supabase/server'
import BookCard from '@/components/books/BookCard'
import Link from 'next/link'
import { Search, SlidersHorizontal, BookOpen, Star, Flame, TrendingUp } from 'lucide-react'
import type { Book, Category } from '@/types'
import { SEED_CATEGORIES } from '@/lib/data/seed-books'

interface SearchParams {
  q?: string
  category?: string
  sort?: string
  featured?: string
  on_sale?: string
  min_price?: string
  max_price?: string
  page?: string
}

const SORTS = [
  { value: 'newest',    label: 'Newest' },
  { value: 'popular',   label: 'Popular' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc',label: 'Price ↓' },
  { value: 'rating',    label: 'Top Rated' },
]

const PAGE_SIZE = 20

async function getBooks(params: SearchParams) {
  const supabase = await createClient()
  let query = supabase
    .from('books')
    .select('*, publishers(company_name), categories(name, slug)', { count: 'exact' })
    .eq('status', 'published')

  if (params.q) {
    query = query.textSearch('title', params.q, { type: 'websearch' })
  }
  if (params.category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', params.category).single()
    if (cat) query = query.eq('category_id', cat.id)
  }
  if (params.featured === 'true') query = query.eq('featured', true)
  if (params.on_sale === 'true')  query = query.eq('on_sale', true)
  if (params.min_price) query = query.gte('price', Number(params.min_price))
  if (params.max_price) query = query.lte('price', Number(params.max_price))

  switch (params.sort) {
    case 'popular':   query = query.order('total_sales', { ascending: false }); break
    case 'price_asc': query = query.order('price',       { ascending: true  }); break
    case 'price_desc':query = query.order('price',       { ascending: false }); break
    case 'rating':    query = query.order('rating',      { ascending: false }); break
    default:          query = query.order('created_at',  { ascending: false })
  }

  const page = Math.max(1, Number(params.page) || 1)
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const { data, count } = await query

  // No demo fallback: an empty result means no matching published books.
  return { books: (data as Book[]) || [], total: count || 0, page }
}

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('sort_order')
  if (!data || data.length === 0) return SEED_CATEGORIES
  return data
}

export default async function BooksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const [{ books, total, page }, categories] = await Promise.all([
    getBooks(params),
    getCategories(),
  ])
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const buildUrl = (overrides: Partial<SearchParams>) => {
    const p = { ...params, ...overrides }
    const qs = Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join('&')
    return `/books${qs ? '?' + qs : ''}`
  }

  const pageTitle = params.q
    ? `Results for "${params.q}"`
    : params.featured === 'true' ? 'Featured Books'
    : params.on_sale === 'true'  ? 'Books on Sale'
    : 'All Ebooks'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container py-8">
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
            {pageTitle}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
            {total.toLocaleString()} book{total !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-60 shrink-0">
            <div
              className="sticky top-20 rounded-2xl p-5 space-y-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-semibold flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
                <SlidersHorizontal className="w-4 h-4 text-gold-500" /> Filters
              </h2>

              {/* Search */}
              <form method="GET" action="/books">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
                  <input
                    name="q"
                    defaultValue={params.q}
                    placeholder="Search books…"
                    className="input pl-9 text-sm py-2.5"
                  />
                </div>
                <button type="submit" className="sr-only">Search</button>
              </form>

              {/* Quick filters */}
              <div className="space-y-2">
                <Link
                  href={buildUrl({ on_sale: params.on_sale === 'true' ? undefined : 'true', page: undefined })}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    background: params.on_sale === 'true' ? 'rgba(220,38,38,0.12)' : 'transparent',
                    border: params.on_sale === 'true' ? '1px solid rgba(220,38,38,0.4)' : '1px solid transparent',
                    color: params.on_sale === 'true' ? '#f87171' : 'var(--text-muted)',
                  }}
                >
                  <Flame className="w-3.5 h-3.5" /> On Sale
                </Link>
                <Link
                  href={buildUrl({ featured: params.featured === 'true' ? undefined : 'true', page: undefined })}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    background: params.featured === 'true' ? 'rgba(245,166,35,0.1)' : 'transparent',
                    border: params.featured === 'true' ? '1px solid rgba(245,166,35,0.35)' : '1px solid transparent',
                    color: params.featured === 'true' ? 'var(--gold)' : 'var(--text-muted)',
                  }}
                >
                  <Star className="w-3.5 h-3.5" /> Featured
                </Link>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-subtle)' }}>
                  Category
                </h3>
                <div className="space-y-0.5">
                  <Link
                    href={buildUrl({ category: undefined, page: undefined })}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      background: !params.category ? 'rgba(245,166,35,0.1)' : 'transparent',
                      color: !params.category ? 'var(--gold)' : 'var(--text-muted)',
                      fontWeight: !params.category ? 600 : 400,
                    }}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    All Categories
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={buildUrl({ category: cat.slug, page: undefined })}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                      style={{
                        background: params.category === cat.slug ? 'rgba(245,166,35,0.1)' : 'transparent',
                        color: params.category === cat.slug ? 'var(--gold)' : 'var(--text-muted)',
                        fontWeight: params.category === cat.slug ? 600 : 400,
                      }}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {(params.q || params.category || params.on_sale || params.featured) && (
                <Link
                  href="/books"
                  className="flex items-center gap-1 text-xs transition-colors"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  Clear all filters
                </Link>
              )}
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-subtle)' }}>Sort:</span>
              {SORTS.map((s) => {
                const active = params.sort === s.value || (!params.sort && s.value === 'newest')
                return (
                  <Link
                    key={s.value}
                    href={buildUrl({ sort: s.value, page: undefined })}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: active ? 'linear-gradient(135deg, #f5a623, #d97706)' : 'var(--surface)',
                      color: active ? '#0a0f1e' : 'var(--text-muted)',
                      border: active ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {s.label}
                  </Link>
                )
              })}
            </div>

            {/* Grid */}
            {books.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} showPublisher />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <BookOpen className="w-9 h-9" style={{ color: 'var(--text-subtle)' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>No books found</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-subtle)' }}>
                  Try adjusting your filters or search terms
                </p>
                <Link href="/books" className="btn-primary text-sm">
                  Browse All Books
                </Link>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  >
                    ← Prev
                  </Link>
                )}
                <span className="text-sm" style={{ color: 'var(--text-subtle)' }}>
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
