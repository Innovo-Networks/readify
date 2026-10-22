'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Book, CartItem } from '@/types'
import { createClient } from '@/lib/supabase/client'

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

// Each account has its own cart, so accounts sharing a browser never see each other's items.
// Signed-out visitors use the "guest" cart.
const CART_KEY_PREFIX = 'readify_cart:'

export function CartProvider({ children }: { children: React.ReactNode }) {
  // undefined = not checked yet, null = signed out, string = signed-in user id
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [items, setItems] = useState<CartItem[]>([])
  // The storage key the current `items` belong to. Saving waits until this matches,
  // so one account's items are never written into another account's cart.
  const [itemsKey, setItemsKey] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const storageKey = userId === undefined ? null : `${CART_KEY_PREFIX}${userId ?? 'guest'}`

  // Load the cart for the current account whenever it changes (sign in, sign out, switch account).
  useEffect(() => {
    if (!storageKey) return
    // Remove the old shared cart that every account used to read from.
    try { localStorage.removeItem('readify_cart') } catch {}
    let loaded: CartItem[] = []
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) loaded = JSON.parse(stored)
    } catch {}
    setItems(loaded)
    setItemsKey(storageKey)
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || itemsKey !== storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(items))
    } catch {}
  }, [items, itemsKey, storageKey])

  const addItem = useCallback((book: Book) => {
    setItems((prev) => {
      if (prev.some((i) => i.book.id === book.id)) return prev
      return [...prev, { book, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((bookId: string) => {
    setItems((prev) => prev.filter((i) => i.book.id !== bookId))
  }, [])

  // Also remove the stored copy so the cart stays empty after a reload.
  const clearCart = useCallback(() => {
    setItems([])
    if (storageKey) {
      try { localStorage.removeItem(storageKey) } catch {}
    }
  }, [storageKey])

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
