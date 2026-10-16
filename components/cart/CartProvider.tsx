'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Book, CartItem } from '@/types'

interface CartContextType {
  items: CartItem[]
  addItem: (book: Book) => void
  removeItem: (bookId: string) => void
  clearCart: () => void
  isInCart: (bookId: string) => boolean
  itemCount: number
  subtotal: number
}

const CartContext = createContext<CartContextType | null>(null)

const CART_KEY = 'readify_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  // Save only once the stored cart has been read; otherwise the initial empty
  // state (doubled by React Strict Mode in dev) overwrites it on every page load.
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addItem = useCallback((book: Book) => {
    setItems((prev) => {
      if (prev.some((i) => i.book.id === book.id)) return prev
      return [...prev, { book, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((bookId: string) => {
    setItems((prev) => prev.filter((i) => i.book.id !== bookId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const isInCart = useCallback(
    (bookId: string) => items.some((i) => i.book.id === bookId),
    [items]
  )

  const itemCount = items.length
  const subtotal = items.reduce((sum, i) => sum + i.book.price, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, isInCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
