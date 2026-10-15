import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export async function createStripeCheckoutSession({
  orderId,
  items,
  buyerEmail,
  successUrl,
  cancelUrl,
}: {
  orderId: string
  items: Array<{ title: string; price: number; quantity: number; coverUrl?: string | null }>
  buyerEmail: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: buyerEmail,
    line_items: items.map((item) => ({
      price_data: {
        currency: 'zar',
        product_data: {
          name: item.title,
          ...(item.coverUrl ? { images: [item.coverUrl] } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    metadata: { orderId },
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_intent_data: { metadata: { orderId } },
  })
  return session
}
