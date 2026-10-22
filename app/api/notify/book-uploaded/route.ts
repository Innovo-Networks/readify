import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendAdminEmail } from '@/lib/email/admin-notify'

const bodySchema = z.object({ bookId: z.string().uuid() })

// Called by the publisher upload page after a book is saved.
// Only the publisher who owns the book can trigger it.
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { data: book } = await supabase
    .from('books')
    .select('id, title, price, status, publisher_id, publishers(company_name)')
    .eq('id', parsed.data.bookId)
    .maybeSingle()
  if (!book || book.publisher_id !== user.id) {
    return NextResponse.json({ error: 'Book not found.' }, { status: 404 })
  }

  const companyName = (book as any).publishers?.company_name ?? '(unknown)'

  await sendAdminEmail({
    subject: `New book uploaded: ${book.title}`,
    heading: 'A publisher has uploaded a book to Readify.',
    rows: [
      ['Book', book.title],
      ['Publisher', companyName],
      ['Price', `R${Number(book.price).toFixed(2)}`],
      ['Status', book.status],
    ],
    link: { href: '/admin/dashboard/books', label: 'Review books' },
  })

  return NextResponse.json({ ok: true })
}
