import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  // Plain service-role client with no user session. The cookie-based admin client
  // sends the buyer's session token, so the download count update is blocked by
  // row-level security and fails silently.
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  // Fetch download record
  const { data: dl } = await supabase
    .from('downloads')
    .select('*, books(file_url, drive_file_id, title)')
    .eq('download_token', token)
    .single()

  if (!dl) return NextResponse.json({ error: 'Invalid download link' }, { status: 404 })
  if (new Date(dl.expires_at) < new Date()) return NextResponse.json({ error: 'Download link has expired' }, { status: 410 })
  if (dl.download_count >= dl.max_downloads) return NextResponse.json({ error: 'Download limit reached' }, { status: 429 })

  // Increment download count
  const { error: countError } = await supabase
    .from('downloads')
    .update({ download_count: dl.download_count + 1, last_downloaded: new Date().toISOString() })
    .eq('id', dl.id)
  if (countError) console.error('Could not update download count', countError)

  const book = dl.books as any

  // Serve from Supabase storage
  if (book?.file_url) {
    const { data } = await supabase.storage.from('ebooks').createSignedUrl(book.file_url, 300)
    if (data?.signedUrl) {
      return NextResponse.redirect(data.signedUrl)
    }
  }

  // Serve from Google Drive (public link)
  if (book?.drive_file_id) {
    const driveUrl = `https://drive.google.com/uc?export=download&id=${book.drive_file_id}`
    return NextResponse.redirect(driveUrl)
  }

  return NextResponse.json({ error: 'File not available' }, { status: 404 })
}
