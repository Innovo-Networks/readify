'use client'

import { useEffect } from 'react'
import { useCart } from './CartProvider'

/** Empties the cart once the order is confirmed as paid. Renders nothing. */
export default function ClearCartOnPaid() {
  const { clearCart } = useCart()
  useEffect(() => {
    clearCart()
  }, [clearCart])
  return null
}
