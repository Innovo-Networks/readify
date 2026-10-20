import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClearCartOnPaid from '@/components/cart/ClearCartOnPaid'
import { Check, Clock, X, Download, BookOpen, ArrowRight, Library } from 'lucide-react'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string; session_id?: string }>
}) {
  const { order_id } = await searchParams
  const supabase = await createClient()

  const { data: order } = order_id
    ? await supabase
        .from('orders')
        .select('*, order_items(*, books(title, cover_url, slug))')
        .eq('id', order_id)
        .single()
    : { data: null }

  const { data: { user } } = await supabase.auth.getUser()

  // Download tokens issued for this order (see lib/fulfillment.ts)
  const orderItemIds: string[] = ((order?.order_items as any[]) || []).map((i) => i.id)
  const { data: purchases } = user && orderItemIds.length > 0
    ? await supabase
        .from('downloads')
        .select('*, books(title)')
        .eq('buyer_id', user.id)
        .in('order_item_id', orderItemIds)
        .order('created_at', { ascending: false })
    : { data: null }

  // The payment provider confirms server-to-server (Stripe webhook / PayFast ITN),
  // which can land a few seconds after the buyer is redirected here.
  const status: string = order?.status ?? 'unknown'
  const paid    = status === 'paid'
  const failed  = status === 'failed' || status === 'cancelled'
  const tone    = paid ? '34,197,94' : failed ? '239,68,68' : '245,166,35'
  const Icon    = paid ? Check : failed ? X : Clock
  const heading = paid ? 'Payment Successful!' : failed ? 'Payment Not Completed' : 'Confirming Your Payment…'
  const blurb   = paid
    ? 'Your ebooks are ready to download. Check your email for a confirmation.'
    : failed
      ? 'The payment was declined or cancelled. Nothing has been charged; you can try again from your cart.'
      : 'We are waiting for the payment provider to confirm. This usually takes a few seconds — refresh this page, or find the download later in My Library.'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: 'var(--bg)' }}
    >
      {paid && <ClearCartOnPaid />}
      <div className="max-w-lg w-full">
        {/* Status icon */}
        <div className="text-center mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in"
            style={{ background: `rgba(${tone},0.12)`, border: `2px solid rgba(${tone},0.3)` }}
          >
            <Icon className="w-12 h-12" style={{ color: `rgb(${tone})` }} />
          </div>
          <h1 className="font-display text-4xl font-bold mb-3" style={{ color: 'var(--text)' }}>
            {heading}
          </h1>
          <p className="mb-2" style={{ color: 'var(--text-muted)' }}>
            {blurb}
          </p>
          {order_id && (
            <p className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>
              Order #{order_id.slice(0, 8).toUpperCase()}
            </p>
          )}
        </div>

        {/* Download links */}
        {purchases && purchases.length > 0 && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Download className="w-5 h-5 text-gold-500" /> Your Downloads
            </h2>
            <div className="space-y-3">
              {(purchases as any[]).map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl"
                  style={{ background: 'var(--bg-raised)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className="w-5 h-5 text-gold-500 shrink-0" />
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                      {purchase.books?.title}
                    </span>
                  </div>
                  <a
                    href={`/api/download/${purchase.download_token}`}
                    className="btn-primary text-xs py-2 px-4 shrink-0 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              ))}
            </div>
            <p className="text-xs mt-4" style={{ color: 'var(--text-subtle)' }}>
              Also available in{' '}
              <Link href="/account" className="text-gold-500 hover:underline">My Library</Link>.
              Each link can be used up to 5 times.
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/account" className="btn-primary flex-1 justify-center">
            <Library className="w-4 h-4" /> My Library <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/books"
            className="btn-ghost flex-1 justify-center"
          >
            Browse More Books
          </Link>
        </div>
      </div>
    </div>
  )
}
