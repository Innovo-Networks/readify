import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Lets an admin open an uploaded ebook file for review. The file lives in a
// private bucket, so this checks the caller is an admin and then redirects to
// a short-lived signed URL.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Plain service-role client with no user session. Using the cookie-based admin
  // client lets the admin's own session token reach storage, where the bucket
  // policies hide the file and it reports "Object not found".
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { data: book } = await admin.from('books').select('file_url').eq('id', id).single()
  if (!book?.file_url) return NextResponse.json({ error: 'No file uploaded for this book' }, { status: 404 })

  const { data, error } = await admin.storage.from('ebooks').createSignedUrl(book.file_url, 600)
  if (!data?.signedUrl) {
    return NextResponse.json({ error: 'Could not open file', detail: error?.message ?? 'no signed URL returned' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}
