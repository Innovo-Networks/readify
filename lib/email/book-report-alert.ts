// Sends an admin alert when a book is reported. Uses Resend's REST API.
// Required env vars: RESEND_API_KEY, BOOK_REPORT_NOTIFY_EMAIL
// Optional: BOOK_REPORT_FROM_EMAIL (must be on a verified Resend domain),
//           NEXT_PUBLIC_APP_URL (used for the link to the admin page).
// If the key or recipient is missing, this does nothing and returns false.

const reasonLabel: Record<string, string> = {
  copyright: 'Copyright',
  misattributed: 'Wrong author/publisher',
  offensive: 'Offensive',
  misleading: 'Misleading',
  other: 'Other',
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type BookReportAlert = {
  bookTitle: string
  reason: string
  reporterName: string
  reporterEmail: string
  details?: string | null
}

export async function sendBookReportAlert(report: BookReportAlert): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.BOOK_REPORT_NOTIFY_EMAIL
  if (!apiKey || !to) return false

  const from = process.env.BOOK_REPORT_FROM_EMAIL || 'Readify <onboarding@resend.dev>'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://readify.co.za'
  const adminLink = `${appUrl}/admin/dashboard/reports`
  const reason = reasonLabel[report.reason] ?? report.reason

  const subject = `New book report: ${report.bookTitle} (${reason})`

  const text = [
    `A book has been reported on Readify.`,
    ``,
    `Book: ${report.bookTitle}`,
    `Reason: ${reason}`,
    `Reported by: ${report.reporterName} <${report.reporterEmail}>`,
    ``,
    `Details:`,
    report.details || '(none)',
    ``,
    `Review it here: ${adminLink}`,
  ].join('\n')

  const html = `
    <p>A book has been reported on Readify.</p>
    <p><strong>Book:</strong> ${escapeHtml(report.bookTitle)}<br>
    <strong>Reason:</strong> ${escapeHtml(reason)}<br>
    <strong>Reported by:</strong> ${escapeHtml(report.reporterName)} &lt;${escapeHtml(report.reporterEmail)}&gt;</p>
    <p><strong>Details:</strong><br>${report.details ? escapeHtml(report.details).replace(/\n/g, '<br>') : '(none)'}</p>
    <p><a href="${escapeHtml(adminLink)}">Review in the admin portal</a></p>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, text, html, reply_to: report.reporterEmail }),
    })
    if (!res.ok) {
      console.error('Book report alert failed', res.status, await res.text())
      return false
    }
    return true
  } catch (error) {
    console.error('Book report alert error', error)
    return false
  }
}
