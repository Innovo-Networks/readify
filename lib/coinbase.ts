const COINBASE_BASE = 'https://api.commerce.coinbase.com'

export async function createCoinbaseCharge({
  orderId,
  total,
  description,
  buyerName,
  buyerEmail,
}: {
  orderId: string
  total: number
  description: string
  buyerName: string
  buyerEmail: string
}) {
  const res = await fetch(`${COINBASE_BASE}/charges`, {
    method: 'POST',
    headers: {
      'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
      'X-CC-Version': '2018-03-22',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Readify Ebook Purchase',
      description,
      local_price: { amount: total.toFixed(2), currency: 'ZAR' },
      pricing_type: 'fixed_price',
      metadata: {
        order_id: orderId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
      },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order_id=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
    }),
  })
  return res.json()
}

export function verifyCoinbaseWebhook(rawBody: string, signature: string): boolean {
  const crypto = require('crypto') as typeof import('crypto')
  const expected = crypto
    .createHmac('sha256', process.env.COINBASE_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')
  return expected === signature
}
