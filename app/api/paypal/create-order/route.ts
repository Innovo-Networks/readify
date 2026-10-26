import { NextResponse } from 'next/server'
import { PAYPAL_ENABLED } from '@/lib/payments'
import { createPayPalOrder } from '@/lib/paypal'

export async function POST(request: Request) {
  if (!PAYPAL_ENABLED) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  try {
    const { orderId, total } = await request.json()
    const paypalOrder = await createPayPalOrder(total, orderId)
    const approvalUrl = paypalOrder.links?.find((l: any) => l.rel === 'approve')?.href
    return NextResponse.json({ paypalOrderId: paypalOrder.id, approvalUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
