import { NextResponse } from 'next/server'
import { PAYPAL_ENABLED } from '@/lib/payments'
import { capturePayPalOrder } from '@/lib/paypal'
import { fulfillPaidOrder } from '@/lib/fulfillment'

export async function POST(request: Request) {
  if (!PAYPAL_ENABLED) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  try {
    const { paypalOrderId, orderId } = await request.json()
    const capture = await capturePayPalOrder(paypalOrderId)

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const ok = await fulfillPaidOrder({ orderId, paymentId: paypalOrderId })
    if (!ok) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    return NextResponse.json({ success: true, orderId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
