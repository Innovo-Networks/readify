'use client'
import { CartProvider } from '@/components/cart/CartProvider'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useEffect } from 'react'

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    // default dark
    const isDark = stored ? stored === 'dark' : true
    document.documentElement.classList.toggle('dark', isDark)
    if (!stored) localStorage.setItem('theme', 'dark')
  }, [])
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
        currency: 'ZAR',
        intent: 'capture',
      }}
      deferLoading
    >
      <CartProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </CartProvider>
    </PayPalScriptProvider>
  )
}
