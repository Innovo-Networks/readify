import { NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'
import { createAdminClient } from '@/lib/supabase/server'
import { generateDownloadToken } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const { paypalOrderId, orderId } = await request.json()
    const capture = await capturePayPalOrder(paypalOrderId)

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: order } = await supabase
      .from('orders')
      .update({ status: 'paid', payment_id: paypalOrderId, paid_at: new Date().toISOString() })
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

    return NextResponse.json({ success: true, orderId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
