import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { ENABLED_PAYMENT_METHODS, type PaymentMethod } from '@/lib/payments'
import { applyPromotion, calculateTotal } from '@/lib/utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Creates a pending order from the cart. The browser only sends book ids and the
 * buyer's details; prices, publisher, titles and the promo discount are all read
 * from the database here, so the client cannot change what it pays.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const bookIds: string[] = Array.isArray(body.items)
      ? Array.from(new Set<string>(body.items.filter((id: unknown): id is string => typeof id === 'string')))
      : []
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const method = body.method as PaymentMethod
    const promoCode = typeof body.promoCode === 'string' && body.promoCode.trim()
      ? body.promoCode.toUpperCase().trim()
      : null

    if (bookIds.length === 0 || bookIds.length > 50) {
      return NextResponse.json({ error: 'Your cart is empty or too large.' }, { status: 400 })
    }
    if (!name || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter your name and a valid email address.' }, { status: 400 })
    }
    if (!ENABLED_PAYMENT_METHODS.includes(method)) {
      return NextResponse.json({ error: 'That payment method is not available.' }, { status: 400 })
    }

    // Downloads belong to an account, so the buyer must be signed in.
    const userClient = await createUserClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 })

    // Plain service-role client: the order and price checks must not depend on the
    // buyer's session, and the buyer should not be able to edit prices directly.
    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { data: books, error: booksError } = await admin
      .from('books')
      .select('id, title, price, cover_url, publisher_id, status')
      .in('id', bookIds)
    if (booksError) throw booksError

    // Only published books from the database can be sold. Demo catalogue titles
    // exist only in code, so they never match and are rejected here.
    const unavailable = bookIds.length !== (books?.length ?? 0) || books!.some((b) => b.status !== 'published')
    if (unavailable || !books) {
      return NextResponse.json(
        { error: 'Some titles in your cart are no longer available. Please remove them and try again.' },
        { status: 409 }
      )
    }

    const subtotal = Math.round(books.reduce((sum, b) => sum + Number(b.price), 0) * 100) / 100

    let discount = 0
    if (promoCode) {
      const { data: promo } = await admin
        .from('promotions').select('*')
        .eq('code', promoCode).eq('is_active', true).maybeSingle()
      const now = new Date()
      if (!promo) return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 400 })
      if (promo.expires_at && new Date(promo.expires_at) < now) return NextResponse.json({ error: 'This promo code has expired' }, { status: 400 })
      if (promo.starts_at && new Date(promo.starts_at) > now) return NextResponse.json({ error: 'This promo code is not active yet' }, { status: 400 })
      if (promo.max_uses && promo.used_count >= promo.max_uses) return NextResponse.json({ error: 'This code has reached its limit' }, { status: 400 })
      discount = applyPromotion(subtotal, promo)
    }

    const { vat, total } = calculateTotal(subtotal, discount)

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        buyer_id:       user.id,
        buyer_name:     name,
        buyer_email:    email,
        subtotal,
        discount,
        vat_amount:     vat,
        vat_rate:       15,
        total,
        currency:       'ZAR',
        payment_method: method,
        promotion_code: promoCode && discount > 0 ? promoCode : null,
        status:         'pending',
      })
      .select('id')
      .single()
    if (orderError || !order) throw orderError ?? new Error('Failed to create order')

    const { error: itemsError } = await admin.from('order_items').insert(
      books.map((b) => ({
        order_id:     order.id,
        book_id:      b.id,
        publisher_id: b.publisher_id,
        title:        b.title,
        cover_url:    b.cover_url,
        price:        b.price,
      }))
    )
    if (itemsError) {
      // Don't leave an empty pending order behind.
      await admin.from('orders').delete().eq('id', order.id)
      throw itemsError
    }

    return NextResponse.json({ orderId: order.id, total })
  } catch (error: any) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Could not create your order. Please try again.' }, { status: 500 })
  }
}
