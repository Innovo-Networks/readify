import { NextResponse } from 'next/server'
import { verifyCoinbaseWebhook } from '@/lib/coinbase'
import { fulfillPaidOrder } from '@/lib/fulfillment'

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

    await fulfillPaidOrder({ orderId, paymentId: event.event?.data?.id })
  }

  return NextResponse.json({ received: true })
}
