// Sends an email to the admin team through Resend's REST API.
// Required env vars: RESEND_API_KEY, and ADMIN_NOTIFY_EMAIL (or BOOK_REPORT_NOTIFY_EMAIL as a fallback).
// Optional: BOOK_REPORT_FROM_EMAIL (must be on a verified Resend domain),
//           NEXT_PUBLIC_APP_URL (used for links into the admin portal).
// If the key or recipient is missing, nothing is sent and the function returns false.

export type AdminEmail = {
  subject: string
  heading: string
  rows: [string, string][]
  link?: { href: string; label: string }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendAdminEmail(email: AdminEmail, options: { replyTo?: string | null } = {}): Promise<boolean> {
  const to = process.env.ADMIN_NOTIFY_EMAIL || process.env.BOOK_REPORT_NOTIFY_EMAIL
  if (!to) return false
  return sendEmailTo(to, email, options)
}

// Sends to any address. Used for admin alerts and for publisher sale emails.
export async function sendEmailTo(to: string, email: AdminEmail, options: { replyTo?: string | null } = {}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !to) return false

  const from = process.env.BOOK_REPORT_FROM_EMAIL || 'Readify <onboarding@resend.dev>'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.milourose.com'
  const link = email.link ? `${appUrl}${email.link.href}` : null

  const text = [
    email.heading,
    '',
    ...email.rows.map(([label, value]) => `${label}: ${value}`),
    ...(link ? ['', `${email.link!.label}: ${link}`] : []),
  ].join('\n')

  const html = `
    <p>${escapeHtml(email.heading)}</p>
    <p>${email.rows.map(([label, value]) => `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}`).join('<br>')}</p>
    ${link ? `<p><a href="${escapeHtml(link)}">${escapeHtml(email.link!.label)}</a></p>` : ''}
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: email.subject,
        text,
        html,
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      }),
    })
    if (!res.ok) {
      console.error('Admin email failed', res.status, await res.text())
      return false
    }
    return true
  } catch (error) {
    console.error('Admin email error', error)
    return false
  }
}
