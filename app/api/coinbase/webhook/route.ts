import { NextResponse } from 'next/server'
import { verifyCoinbaseWebhook } from '@/lib/coinbase'
import { createAdminClient } from '@/lib/supabase/server'
import { generateDownloadToken } from '@/lib/utils'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-cc-webhook-signature') || ''

  if (!verifyCoinbaseWebhook(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)
  const type = event.event?.type

  if (type === 'charge:confirmed' || type === 'charge:resolved') {
    const orderId = event.event?.data?.metadata?.order_id
    if (!orderId) return NextResponse.json({ received: true })

    const supabase = await createAdminClient()

    const { data: order } = await supabase
      .from('orders')
      .update({ status: 'paid', payment_id: event.event?.data?.id, paid_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('buyer_id')
      .single()

    const { data: items } = await supabase
      .from('order_items')
      .select('id, book_id')
      .eq('order_id', orderId)

    if (items && order) {
      for (const item of items) {
        await supabase.from('downloads').insert({
          order_item_id: item.id,
          buyer_id: order.buyer_id,
          book_id: item.book_id,
          download_token: generateDownloadToken(),
          max_downloads: 5,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
