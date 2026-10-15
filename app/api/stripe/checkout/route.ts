import { NextResponse } from 'next/server'
import { createStripeCheckoutSession } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { orderId, items, buyerEmail } = await request.json()

    const session = await createStripeCheckoutSession({
      orderId,
      items,
      buyerEmail,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
