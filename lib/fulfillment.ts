import { createAdminClient } from '@/lib/supabase/server'
import { generateDownloadToken } from '@/lib/utils'
import { sendAdminEmail } from '@/lib/email/admin-notify'

const MAX_DOWNLOADS = 5
const DOWNLOAD_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000 // 1 year

/**
 * Mark an order as paid and issue one download token per purchased book.
 *
 * Shared by the Stripe webhook, the PayPal capture route and the Coinbase
 * webhook so all three providers write the same rows to `orders`,
 * `downloads` and `books` (see supabase/schema.sql).
 *
 * Runs with the service-role client, so it bypasses RLS. Returns false when
 * the order does not exist.
 */
export async function fulfillPaidOrder({ orderId, paymentId }: { orderId: string; paymentId: string }) {
  const supabase = await createAdminClient()

  // Read the previous status so the admin alert only goes out once, even if a provider retries the webhook.
  const { data: previous } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle()

  const { data: order } = await supabase
    .from('orders')
    .update({ status: 'paid', payment_id: paymentId, paid_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('buyer_id, total, buyer_name, buyer_email, payment_method')
    .single()

  if (!order) return false

  const { data: items } = await supabase
    .from('order_items')
    .select('id, book_id, price, books(title)')
    .eq('order_id', orderId)

  for (const item of items || []) {
    // downloads.buyer_id is NOT NULL; guest orders cannot receive tokens yet.
    if (order.buyer_id) {
      await supabase.from('downloads').insert({
        order_item_id: item.id,
        buyer_id: order.buyer_id,
        book_id: item.book_id,
        download_token: generateDownloadToken(),
        max_downloads: MAX_DOWNLOADS,
        expires_at: new Date(Date.now() + DOWNLOAD_VALIDITY_MS).toISOString(),
      })
    }
    await supabase.rpc('increment_book_sales', { p_book_id: item.book_id, p_price: item.price })
  }

  if (previous?.status !== 'paid') {
    await notifyAdminOfSale(orderId, order, items || [])
  }

  return true
}

async function notifyAdminOfSale(
  orderId: string,
  order: { total: number | string; buyer_name: string | null; buyer_email: string; payment_method: string | null },
  items: { price: number | string; books?: { title: string } | { title: string }[] | null }[],
) {
  try {
    const titles = items.map((item) => {
      const book = Array.isArray(item.books) ? item.books[0] : item.books
      return `${book?.title ?? 'Unknown book'} (R${Number(item.price).toFixed(2)})`
    })
    await sendAdminEmail({
      subject: `New sale: R${Number(order.total).toFixed(2)}`,
      heading: 'A book was purchased on Readify.',
      rows: [
        ['Order', orderId],
        ['Total', `R${Number(order.total).toFixed(2)}`],
        ['Payment', order.payment_method || 'unknown'],
        ['Buyer', `${order.buyer_name || '(no name)'} <${order.buyer_email}>`],
        ['Books', titles.join(', ') || '(none)'],
      ],
      link: { href: '/admin/dashboard', label: 'Open the admin dashboard' },
    })
  } catch (error) {
    console.error('Sale alert failed', error)
  }
}

export async function markOrderFailed(orderId: string) {
  const supabase = await createAdminClient()
  await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
}
