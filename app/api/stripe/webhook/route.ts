import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { fulfillPaidOrder, markOrderFailed } from '@/lib/fulfillment'
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
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId
    if (!orderId) return NextResponse.json({ received: true })

    const ok = await fulfillPaidOrder({ orderId, paymentId: session.id })
    if (!ok) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const orderId = pi.metadata?.orderId
    if (orderId) await markOrderFailed(orderId)
  }

  return NextResponse.json({ received: true })
}
