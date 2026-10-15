import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatted by hand rather than Intl.NumberFormat: Node and browsers ship different
// ICU data for en-ZA ("R 149.00" vs "R 149,00"), which caused React hydration errors.
// Output follows SA convention: non-breaking space as thousands separator, comma decimals.
export function formatZAR(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const [whole, cents] = Math.abs(amount).toFixed(2).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${sign}R ${grouped},${cents}`
}

export function calculateVAT(amount: number, rate = 0.15): number {
  return Math.round(amount * rate * 100) / 100
}

export function calculateTotal(subtotal: number, discount = 0): {
  subtotal: number
  discount: number
  vat: number
  total: number
} {
  const discounted = subtotal - discount
  const vat = calculateVAT(discounted)
  const total = Math.round((discounted + vat) * 100) / 100
  return { subtotal, discount, vat, total }
}

export function applyPromotion(
  subtotal: number,
  promo: { discount_type: 'percentage' | 'fixed'; discount_value: number; min_order_amount?: number | null } | null
): number {
  if (!promo) return 0
  if (promo.min_order_amount && subtotal < promo.min_order_amount) return 0
  if (promo.discount_type === 'percentage') {
    return Math.round((subtotal * promo.discount_value) / 100 * 100) / 100
  }
  return Math.min(promo.discount_value, subtotal)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export function generateDownloadToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function starRating(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}
