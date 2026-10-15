'use client'
import { useCart } from '@/components/cart/CartProvider'
import { ShoppingCart, Check, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Book } from '@/types'

export default function AddToCartButton({ book }: { book: Book }) {
  const { addItem, removeItem, isInCart } = useCart()
  const router = useRouter()
  const inCart = isInCart(book.id)

  const buyNow = () => {
    if (!inCart) addItem(book)
    router.push('/checkout')
  }

  if (inCart) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 justify-center py-3 rounded-xl bg-green-50 text-green-700 font-medium text-sm border border-green-200">
          <Check className="w-4 h-4" /> Added to cart
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => removeItem(book.id)}
            className="flex-1 py-2 text-sm text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 rounded-xl transition-colors"
          >
            Remove
          </button>
          <Link href="/cart" className="flex-1 btn-secondary text-sm text-center justify-center py-2">
            View Cart
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => addItem(book)}
        className="btn-outline w-full justify-center"
      >
        <ShoppingCart className="w-4 h-4" />
        Add to Cart
      </button>
      <button onClick={buyNow} className="btn-primary w-full justify-center">
        <Zap className="w-4 h-4" />
        Buy Now
      </button>
    </div>
  )
}
