import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'How It Works' }

const STEPS = [
  {
    title: 'Find your ebook',
    body: 'Browse by category, search by title or author, or look at featured books and current specials.',
  },
  {
    title: 'Pay in Rand',
    body: 'Check out securely in South African Rand. 15% VAT is added at checkout. You can pay with PayFast.',
  },
  {
    title: 'Download instantly',
    body: 'Your ebook is ready in your library as soon as payment is confirmed. Each purchase allows up to 5 downloads.',
  },
  {
    title: 'Read anywhere',
    body: 'Open the file on your phone, tablet or computer with any standard ebook reader.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="page-container py-16 max-w-3xl">
      <h1 className="font-display text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>
        How It Works
      </h1>
      <p className="mb-10" style={{ color: 'var(--text-muted)' }}>
        Buying an ebook on Readify takes a few minutes, from browsing to your first page.
      </p>

      <ol className="space-y-8">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-5">
            <span
              className="font-display text-2xl font-bold shrink-0 w-10"
              style={{ color: 'var(--gold)' }}
            >
              {i + 1}
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
                {step.title}
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-col sm:flex-row gap-3">
        <Link href="/books" className="btn-primary">Browse Ebooks</Link>
        <a href="mailto:support@innovonet.co.za" className="btn-secondary">Contact Support</a>
      </div>
    </div>
  )
}
