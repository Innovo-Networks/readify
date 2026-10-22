import BookCard from '@/components/books/BookCard'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatZAR } from '@/lib/utils'
import { Star, BookOpen, Calendar, Globe, Hash, FileText, Download, ArrowLeft, ShieldCheck } from 'lucide-react'
import type { Book, Review } from '@/types'
import AddToCartButton from '@/components/books/AddToCartButton'
import ReportBookForm from '@/components/books/ReportBookForm'
import { SEED_BOOKS } from '@/lib/data/seed-books'
import { isSeedBookId } from '@/lib/payments'

async function getBook(slug: string): Promise<Book | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('books')
    .select('*, publishers(*), categories(name, slug)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (data) return data as Book
  // Fall back to the seed catalogue (same source /books uses while the database is empty)
  return SEED_BOOKS.find((b) => b.slug === slug) ?? null
}

async function getReviews(bookId: string): Promise<Review[]> {
  if (isSeedBookId(bookId)) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('*, profiles(full_name, avatar_url)')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })
    .limit(10)
  return (data as Review[]) || []
}

async function getRelated(categoryId: string | null, currentId: string): Promise<Book[]> {
  if (!categoryId) return []
  if (isSeedBookId(currentId)) {
    return SEED_BOOKS.filter((b) => b.category_id === categoryId && b.id !== currentId).slice(0, 4)
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from('books')
    .select('*, categories(name, slug)')
    .eq('status', 'published')
    .eq('category_id', categoryId)
    .neq('id', currentId)
    .limit(4)
  return (data as Book[]) || []
}

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const book = await getBook(slug)
  if (!book) notFound()

  const [reviews, related] = await Promise.all([
    getReviews(book.id),
    getRelated(book.category_id, book.id),
  ])

  const discount = book.original_price
    ? Math.round(((book.original_price - book.price) / book.original_price) * 100)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <span>/</span>
            <Link href="/books" className="hover:text-brand-600">Books</Link>
            {book.categories && (
              <>
                <span>/</span>
                <Link href={`/books?category=${book.categories.slug}`} className="hover:text-brand-600">
                  {book.categories.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{book.title}</span>
          </nav>
        </div>
      </div>

      <div className="page-container py-10">
        <Link href="/books" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to books
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Cover + info */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row gap-8">
              {/* Cover */}
              <div className="shrink-0">
                <div className="w-full sm:w-48 md:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
                  {book.cover_url ? (
                    <Image src={book.cover_url} alt={book.title} width={224} height={298} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200">
                      <BookOpen className="w-16 h-16 text-brand-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Title + meta */}
              <div className="flex-1">
                {book.categories && (
                  <Link href={`/books?category=${book.categories.slug}`} className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2 block hover:text-brand-700">
                    {book.categories.name}
                  </Link>
                )}
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1 text-balance">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="text-gray-500 text-lg mb-3">{book.subtitle}</p>
                )}
                {book.author && (
                  <p className="text-gray-600 mb-3">by <span className="font-semibold">{book.author}</span></p>
                )}

                {/* Publisher */}
                {book.publishers && (
                  <p className="text-sm text-gray-500 mb-4">
                    Published by{' '}
                    <span className="text-gray-700 font-medium">{book.publishers.company_name}</span>
                  </p>
                )}

                {/* Rating */}
                {book.review_count > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(book.rating) ? 'text-gold-500 fill-gold-500' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-900">{book.rating.toFixed(1)}</span>
                    <span className="text-gray-400 text-sm">({book.review_count} review{book.review_count !== 1 ? 's' : ''})</span>
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {book.featured && <span className="badge bg-gold-100 text-gold-700">⭐ Featured</span>}
                  {book.on_sale && discount && <span className="badge bg-red-100 text-red-700">-{discount}% OFF</span>}
                  <span className="badge bg-gray-100 text-gray-600">{book.language}</span>
                  {book.pages && <span className="badge bg-gray-100 text-gray-600">{book.pages} pages</span>}
                </div>

                {/* Book details */}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
                  {book.publication_date && (
                    <>
                      <dt className="flex items-center gap-1.5 text-gray-400"><Calendar className="w-3.5 h-3.5" /> Published</dt>
                      <dd>{new Date(book.publication_date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })}</dd>
                    </>
                  )}
                  {book.isbn && (
                    <>
                      <dt className="flex items-center gap-1.5 text-gray-400"><Hash className="w-3.5 h-3.5" /> ISBN</dt>
                      <dd className="font-mono">{book.isbn}</dd>
                    </>
                  )}
                  {book.total_sales > 0 && (
                    <>
                      <dt className="flex items-center gap-1.5 text-gray-400"><Download className="w-3.5 h-3.5" /> Sales</dt>
                      <dd>{book.total_sales.toLocaleString()} copies</dd>
                    </>
                  )}
                  <dt className="flex items-center gap-1.5 text-gray-400"><FileText className="w-3.5 h-3.5" /> Format</dt>
                  <dd>PDF (Digital Download)</dd>
                </dl>

                {/* Tags */}
                {book.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {book.tags.map((tag) => (
                      <Link key={tag} href={`/books?q=${encodeURIComponent(tag)}`} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-brand-50 hover:text-brand-700 transition-colors">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {book.description && (
              <div className="mt-10">
                <h2 className="text-lg font-bold text-gray-900 mb-4">About This Book</h2>
                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed">
                  {book.description.split('\n').map((p, i) => (
                    <p key={i} className="mb-3">{p}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Report */}
            {!isSeedBookId(book.id) && (
              <div className="mt-10">
                <ReportBookForm bookId={book.id} />
              </div>
            )}

            {/* Reviews */}
            <div className="mt-10">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Reviews
                {reviews.length > 0 && <span className="text-gray-400 font-normal ml-2 text-base">({reviews.length})</span>}
              </h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">No reviews yet. Be the first to review this book after purchasing!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                            {(review.profiles as any)?.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{(review.profiles as any)?.full_name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('en-ZA')}</p>
                          </div>
                        </div>
                        <div className="flex">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-gold-500 fill-gold-500' : 'text-gray-200 fill-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      {review.title && <p className="font-semibold text-sm text-gray-900 mb-1">{review.title}</p>}
                      {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
                      {review.is_verified && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified Purchase
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Purchase card */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold text-gray-900">{formatZAR(book.price)}</span>
                  {book.original_price && (
                    <span className="text-lg text-gray-400 line-through">{formatZAR(book.original_price)}</span>
                  )}
                </div>
                {discount && <p className="text-sm text-green-600 font-medium mt-1">You save {formatZAR(book.original_price! - book.price)} ({discount}% off)</p>}
                <p className="text-xs text-gray-400 mt-1">Price includes 15% VAT</p>
              </div>

              <AddToCartButton book={book} />

              {book.sample_url && (
                <a href={book.sample_url} target="_blank" rel="noopener noreferrer" className="btn-outline w-full mt-2 justify-center text-sm">
                  📄 Preview Sample
                </a>
              )}

              <div className="mt-6 pt-5 border-t border-gray-100 space-y-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-brand-500" />
                  Instant PDF download after payment
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Secure payment via PayFast or Stripe
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  Download up to 5 times
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related books */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6">More in {book.categories?.name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-5">
              {related.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
