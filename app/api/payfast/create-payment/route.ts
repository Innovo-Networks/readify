import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPayfastPayment } from '@/lib/payfast'

/**
 * Returns the signed field set the browser must POST to PayFast for one of the
 * caller's own pending orders. Runs with the user's session (RLS), so a buyer
 * can only pay for orders they created.
 */
export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()
    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

    const supabase = await createClient()
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, total, buyer_name, buyer_email, order_items(title)')
      .eq('id', orderId)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status !== 'pending') return NextResponse.json({ error: `Order is already ${order.status}` }, { status: 409 })

    const items = (order.order_items as Array<{ title: string }>) || []
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

    const payment = buildPayfastPayment({
      orderId: order.id,
      amount: Number(order.total),
      itemName: items.length === 1 ? items[0].title : `Readify: ${items.length} ebooks`,
      itemDescription: items.map((i) => i.title).join(', '),
      buyerEmail: order.buyer_email,
      buyerName: order.buyer_name,
      returnUrl: `${appUrl}/checkout/success?order_id=${order.id}`,
      cancelUrl: `${appUrl}/cart`,
      notifyUrl: `${appUrl}/api/payfast/notify`,
    })

    return NextResponse.json(payment)
  } catch (error: any) {
    console.error('PayFast create-payment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
