import { NextResponse } from 'next/server'
import { COINBASE_ENABLED } from '@/lib/payments'
import { createCoinbaseCharge } from '@/lib/coinbase'

export async function POST(request: Request) {
  if (!COINBASE_ENABLED) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  try {
    const { orderId, total, buyerName, buyerEmail, description } = await request.json()
    const charge = await createCoinbaseCharge({ orderId, total, description, buyerName, buyerEmail })
    return NextResponse.json({ chargeId: charge.data?.id, hostedUrl: charge.data?.hosted_url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
