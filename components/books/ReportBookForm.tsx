'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'

const reasons = [
  { value: 'copyright', label: 'I own this work and it was published without permission' },
  { value: 'misattributed', label: 'Wrong author or publisher is credited' },
  { value: 'offensive', label: 'This book is offensive or harmful' },
  { value: 'misleading', label: 'The listing is misleading' },
  { value: 'other', label: 'Something else' },
] as const

export default function ReportBookForm({ bookId }: { bookId: string }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    setStatus('sending')
    setMessage('')

    try {
      const res = await fetch('/api/book-reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bookId,
          reporterName: data.get('reporterName'),
          reporterEmail: data.get('reporterEmail'),
          reason: data.get('reason'),
          details: data.get('details') || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus('sent')
        form.reset()
      } else {
        setStatus('error')
        setMessage(json.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (status === 'sent') {
    return (
      <p className="text-sm text-green-700">
        Thank you. We have received your report and will review it.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
      >
        <Flag className="w-4 h-4" /> Report this book
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 space-y-4 max-w-xl">
      <div>
        <h3 className="font-semibold text-gray-900">Report this book</h3>
        <p className="text-sm text-gray-500">
          Authors, publishers and readers can report content here. We review every report.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-gray-700">Your name</span>
          <input name="reporterName" required minLength={2} maxLength={120} className="input mt-1 w-full" />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Your email</span>
          <input name="reporterEmail" type="email" required maxLength={254} className="input mt-1 w-full" />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm text-gray-700 mb-1">Reason</legend>
        {reasons.map((r, i) => (
          <label key={r.value} className="flex items-start gap-2 text-sm text-gray-600">
            <input type="radio" name="reason" value={r.value} required defaultChecked={i === 0} className="mt-1" />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>

      <label className="block text-sm">
        <span className="text-gray-700">Details (optional)</span>
        <textarea name="details" rows={3} maxLength={2000} className="input mt-1 w-full" />
      </label>

      {status === 'error' && <p className="text-sm text-red-600">{message}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={status === 'sending'} className="btn-primary text-sm disabled:opacity-60">
          {status === 'sending' ? 'Sending…' : 'Send report'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline text-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}
