import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAdminEmail } from '@/lib/email/admin-notify'

// Called by the publisher registration page after the application is saved.
// Only the signed-in applicant can trigger it, and it only reads their own publisher record.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { data: publisher } = await supabase
    .from('publishers')
    .select('company_name, city, province, phone, website, status')
    .eq('id', user.id)
    .maybeSingle()
  if (!publisher) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })

  await sendAdminEmail(
    {
      subject: `New publisher application: ${publisher.company_name}`,
      heading: 'A publisher has applied to sell on Readify.',
      rows: [
        ['Company', publisher.company_name],
        ['Account email', user.email ?? '(unknown)'],
        ['Location', [publisher.city, publisher.province].filter(Boolean).join(', ') || '(not given)'],
        ['Phone', publisher.phone || '(not given)'],
        ['Website', publisher.website || '(not given)'],
        ['Status', publisher.status],
      ],
      link: { href: '/admin/dashboard/publishers', label: 'Review applications' },
    },
  )

  return NextResponse.json({ ok: true })
}
