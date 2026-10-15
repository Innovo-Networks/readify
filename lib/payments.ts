/**
 * Which optional integrations are switched on, derived from public env vars so
 * the same values work on the server, in the browser and in Vercel previews.
 * Stripe is always on; the others stay hidden until real credentials exist.
 */
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''

export const PAYPAL_ENABLED =
  paypalClientId.length > 20 && !/placeholder|your-|^test$/i.test(paypalClientId)

export const COINBASE_ENABLED = process.env.NEXT_PUBLIC_COINBASE_ENABLED === 'true'

export const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'

// PayFast (South Africa): card, Instant EFT, SnapScan, Zapper, Mobicred. Listed first when on.
export const PAYFAST_ENABLED = process.env.NEXT_PUBLIC_PAYFAST_ENABLED === 'true'

export type PaymentMethod = 'payfast' | 'stripe' | 'paypal' | 'coinbase'

export const ENABLED_PAYMENT_METHODS: readonly PaymentMethod[] = [
  ...(PAYFAST_ENABLED ? (['payfast'] as const) : []),
  'stripe',
  ...(PAYPAL_ENABLED ? (['paypal'] as const) : []),
  ...(COINBASE_ENABLED ? (['coinbase'] as const) : []),
]

/** Seed-catalogue books (lib/data/seed-books.ts) exist only in code, never in the database. */
export function isSeedBookId(id: string): boolean {
  return id.startsWith('seed-')
}
