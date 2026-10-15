import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { generateDownloadToken } from '@/lib/utils'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const orderId = session.metadata?.orderId
    if (!orderId) return NextResponse.json({ received: true })

    const supabase = await createAdminClient()

    // Mark order as paid
    const { data: order } = await supabase
      .from('orders')
      .update({ status: 'paid', payment_id: session.id, paid_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('buyer_id, buyer_email')
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Get order items and create download tokens
    const { data: items } = await supabase
      .from('order_items')
      .select('id, book_id, books(publisher_id)')
      .eq('order_id', orderId)

    if (items) {
      for (const item of items) {
        const token = generateDownloadToken()
        await supabase.from('downloads').insert({
          order_item_id: item.id,
          buyer_id: order.buyer_id,
          book_id: item.book_id,
          download_token: token,
          max_downloads: 5,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })

        // Update book sales count
        await supabase.rpc('increment_book_sales', { book_id: item.book_id, price: 0 })
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const orderId = pi.metadata?.orderId
    if (orderId) {
      const supabase = await createAdminClient()
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
    }
  }

  return NextResponse.json({ received: true })
}
