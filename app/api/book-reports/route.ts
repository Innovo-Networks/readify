import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendBookReportAlert } from '@/lib/email/book-report-alert'

const reportSchema = z.object({
  bookId: z.string().uuid(),
  reporterName: z.string().trim().min(2).max(120),
  reporterEmail: z.string().trim().email().max(254),
  reason: z.enum(['copyright', 'misattributed', 'offensive', 'misleading', 'other']),
  details: z.string().trim().max(2000).optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = reportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the form and try again.' }, { status: 400 })
  }
  const data = parsed.data

  const supabase = await createClient()

  // Only reports on books that are currently live on the store.
  const { data: book } = await supabase
    .from('books')
    .select('id, title')
    .eq('id', data.bookId)
    .eq('status', 'published')
    .maybeSingle()
  if (!book) {
    return NextResponse.json({ error: 'This book could not be found.' }, { status: 404 })
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('book_reports').insert({
    book_id: data.bookId,
    reporter_id: user?.id ?? null,
    reporter_name: data.reporterName,
    reporter_email: data.reporterEmail,
    reason: data.reason,
    details: data.details || null,
  })
  if (error) {
    return NextResponse.json({ error: 'We could not send your report. Please try again.' }, { status: 500 })
  }

  // Alert the admin team. The report is already saved, so a failed email never blocks the reporter.
  await sendBookReportAlert({
    bookTitle: book.title,
    reason: data.reason,
    reporterName: data.reporterName,
    reporterEmail: data.reporterEmail,
    details: data.details || null,
  })

  return NextResponse.json({ ok: true })
}
