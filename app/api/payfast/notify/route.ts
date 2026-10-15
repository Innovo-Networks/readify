import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkItn, parseFormBody, payfastConfig, validateItnWithPayfast } from '@/lib/payfast'
import { fulfillPaidOrder, markOrderFailed } from '@/lib/fulfillment'

/**
 * PayFast Instant Transaction Notification (ITN).
 * PayFast POSTs here server-to-server after a payment attempt. We must answer
 * 200 quickly; any non-200 makes PayFast retry. Checks, in order:
 *   1. signature (with passphrase), merchant_id and amount against our order
 *   2. PayFast's own validate endpoint confirms the notification is genuine
 * Only then is the order fulfilled.
 */
export async function POST(request: Request) {
  const body = await request.text()
  const data = parseFormBody(body)
  const map = Object.fromEntries(data)
  const orderId = map['m_payment_id']
  const config = payfastConfig()

  if (!orderId) return new NextResponse('missing m_payment_id', { status: 200 })

  const supabase = await createAdminClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total, payment_method')
    .eq('id', orderId)
    .single()

  if (!order) {
    console.warn('PayFast ITN for unknown order', orderId)
    return new NextResponse('unknown order', { status: 200 })
  }

  const check = checkItn({
    data,
    passphrase: config.passphrase,
    expectedMerchantId: config.merchantId,
    expectedAmount: Number(order.total),
  })
  if (!check.ok) {
    console.warn('PayFast ITN rejected:', check.reason, 'order', orderId)
    return new NextResponse(`rejected: ${check.reason}`, { status: 200 })
  }

  const genuine = await validateItnWithPayfast(data, config.validateUrl)
  if (!genuine) {
    console.warn('PayFast ITN failed remote validation for order', orderId)
    return new NextResponse('rejected: not validated by PayFast', { status: 200 })
  }

  if (order.status === 'paid') return new NextResponse('already paid', { status: 200 })

  const status = map['payment_status']
  if (status === 'COMPLETE') {
    await fulfillPaidOrder({ orderId, paymentId: map['pf_payment_id'] || 'payfast' })
  } else if (status === 'FAILED' || status === 'CANCELLED') {
    await markOrderFailed(orderId)
  }
  // PENDING (e.g. EFT awaiting clearance) leaves the order pending until the next ITN.

  return new NextResponse('OK', { status: 200 })
}
