import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="page-container flex flex-col items-center justify-center text-center py-24 min-h-[60vh]">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <BookOpen className="w-8 h-8 text-gold-500" />
      </div>
      <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>
        404
      </p>
      <h1 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--text)' }}>
        This page has gone missing
      </h1>
      <p className="max-w-md mb-8" style={{ color: 'var(--text-muted)' }}>
        The page you were looking for doesn&apos;t exist, or the book is no longer available.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/books" className="btn-primary">Browse Ebooks</Link>
        <Link href="/" className="btn-secondary">Back to Home</Link>
      </div>
    </div>
  )
}
