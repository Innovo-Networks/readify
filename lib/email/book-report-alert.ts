import { sendAdminEmail } from '@/lib/email/admin-notify'

const reasonLabel: Record<string, string> = {
  copyright: 'Copyright',
  misattributed: 'Wrong author/publisher',
  offensive: 'Offensive',
  misleading: 'Misleading',
  other: 'Other',
}

export type BookReportAlert = {
  bookTitle: string
  reason: string
  reporterName: string
  reporterEmail: string
  details?: string | null
}

export async function sendBookReportAlert(report: BookReportAlert): Promise<boolean> {
  const reason = reasonLabel[report.reason] ?? report.reason
  return sendAdminEmail(
    {
      subject: `New book report: ${report.bookTitle} (${reason})`,
      heading: 'A book has been reported on Readify.',
      rows: [
        ['Book', report.bookTitle],
        ['Reason', reason],
        ['Reported by', `${report.reporterName} <${report.reporterEmail}>`],
        ['Details', report.details || '(none)'],
      ],
      link: { href: '/admin/dashboard/reports', label: 'Review in the admin portal' },
    },
  )
}
