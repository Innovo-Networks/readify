import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { sendEmailTo } from '@/lib/email/admin-notify'

async function updatePublisherStatus(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  const rejection_reason = formData.get('rejection_reason') as string | undefined

  await supabase.from('publishers').update({
    status,
    ...(status === 'approved' ? { approved_at: new Date().toISOString() } : {}),
    ...(rejection_reason ? { rejection_reason } : {}),
  }).eq('id', id)

  // Also update profile role back to buyer if rejected
  if (status === 'rejected') {
    await supabase.from('profiles').update({ role: 'buyer' }).eq('id', id)
  }

  // Tell the publisher the decision. Failures are logged and never block the admin action.
  if (status === 'approved' || status === 'rejected') {
    try {
      const { data: publisher } = await supabase
        .from('publishers')
        .select('company_name, rejection_reason, profiles(email)')
        .eq('id', id)
        .maybeSingle()
      const email = (publisher as any)?.profiles?.email as string | undefined
      if (publisher && email) {
        if (status === 'approved') {
          await sendEmailTo(email, {
            subject: 'Your Readify publisher application is approved',
            heading: 'Welcome to Readify. Your publisher application has been approved.',
            rows: [
              ['Company', publisher.company_name],
              ['Next step', 'Log in and upload your first ebook from your publisher dashboard.'],
            ],
            link: { href: '/publisher/dashboard', label: 'Go to your publisher dashboard' },
          })
        } else {
          await sendEmailTo(email, {
            subject: 'Update on your Readify publisher application',
            heading: 'Thanks for applying to sell on Readify. We were unable to approve your application at this time.',
            rows: [
              ['Company', publisher.company_name],
              ['Reason', publisher.rejection_reason || 'Not specified'],
              ['Questions', 'support@innovonet.co.za'],
            ],
          })
        }
      }
    } catch (error) {
      console.error('Publisher decision email failed', error)
    }
  }
}

export default async function AdminPublishersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const params = await searchParams
  const filter = params.status || 'pending'

  const { data: publishers } = await supabase
    .from('publishers')
    .select('*, profiles(email, full_name, created_at)')
    .eq('status', filter)
    .order('created_at', { ascending: false })

  // Verification documents are private. Short-lived links let the admin open them for review.
  const sign = async (path: string | null) =>
    path ? (await supabase.storage.from('publisher-documents').createSignedUrl(path, 600)).data?.signedUrl ?? null : null
  const withDocs = await Promise.all(
    ((publishers ?? []) as any[]).map(async (pub) => ({
      ...pub,
      docs: {
        cipc: await sign(pub.cipc_document_path),
        bank: await sign(pub.bank_letter_path),
        vat: await sign(pub.vat_letter_path),
      },
    }))
  )

  const { data: counts } = await supabase.from('publishers').select('status')
  const statusCounts = (counts || []).reduce((acc: Record<string, number>, p: any) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-5 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Publisher Management</h1>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Status tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" /> },
            { key: 'approved', label: 'Approved', icon: <CheckCircle2 className="w-4 h-4" /> },
            { key: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
            { key: 'suspended', label: 'Suspended', icon: <X className="w-4 h-4" /> },
          ].map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/dashboard/publishers?status=${tab.key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === tab.key ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'}`}
            >
              {tab.icon} {tab.label}
              {statusCounts[tab.key] !== undefined && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {statusCounts[tab.key]}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Publisher list */}
        {!publishers || publishers.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            No {filter} publishers
          </div>
        ) : (
          <div className="space-y-4">
            {withDocs.map((pub) => (
              <div key={pub.id} className="card p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
                        {pub.company_name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{pub.company_name}</h3>
                        <p className="text-sm text-gray-500">{pub.profiles?.email}</p>
                      </div>
                    </div>

                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                      {[
                        { label: 'Contact', value: pub.phone || '—' },
                        { label: 'VAT Number', value: pub.vat_number || '—' },
                        { label: 'CIPC Registration', value: pub.cipc_registration || '—' },
                        { label: 'City', value: `${pub.city || '—'}, ${pub.province || '—'}` },
                        { label: 'Postal Code', value: pub.postal_code || '—' },
                        { label: 'Bank', value: pub.bank_name ? `${pub.bank_name} (${pub.bank_account_type || '—'})` : '—' },
                        { label: 'Account Number', value: pub.bank_account_number || '—' },
                        { label: 'Branch Code', value: pub.bank_branch_code || '—' },
                        { label: 'Applied', value: new Date(pub.created_at).toLocaleDateString('en-ZA') },
                      ].map((item) => (
                        <div key={item.label}>
                          <dt className="text-xs text-gray-400 mb-0.5">{item.label}</dt>
                          <dd className="font-medium text-gray-700 font-mono text-xs">{item.value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-2">
                        Verification documents (links expire after 10 minutes; reload to open again)
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {[
                          { label: 'CIPC certificate', url: pub.docs.cipc },
                          { label: 'Bank letter', url: pub.docs.bank },
                          { label: 'VAT letter', url: pub.docs.vat },
                        ].map((doc) =>
                          doc.url ? (
                            <a key={doc.label} href={doc.url} target="_blank" rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-medium">
                              {doc.label} ↗
                            </a>
                          ) : (
                            <span key={doc.label} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400">
                              {doc.label}: not uploaded
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {pub.bio && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 line-clamp-3">{pub.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {filter === 'pending' && (
                    <div className="flex gap-3 lg:flex-col shrink-0">
                      <form action={updatePublisherStatus} className="flex-1 lg:flex-none">
                        <input type="hidden" name="id" value={pub.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                          <Check className="w-4 h-4" /> Approve
                        </button>
                      </form>
                      <form action={updatePublisherStatus} className="flex-1 lg:flex-none">
                        <input type="hidden" name="id" value={pub.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <input type="hidden" name="rejection_reason" value="Application does not meet our requirements." />
                        <button className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </form>
                    </div>
                  )}
                  {filter === 'approved' && (
                    <form action={updatePublisherStatus}>
                      <input type="hidden" name="id" value={pub.id} />
                      <input type="hidden" name="status" value="suspended" />
                      <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                        <X className="w-4 h-4" /> Suspend
                      </button>
                    </form>
                  )}
                  {(filter === 'rejected' || filter === 'suspended') && (
                    <form action={updatePublisherStatus}>
                      <input type="hidden" name="id" value={pub.id} />
                      <input type="hidden" name="status" value="approved" />
                      <button className="flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                        <Check className="w-4 h-4" /> Re-approve
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
