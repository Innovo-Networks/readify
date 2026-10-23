'use client'

import { Trash2 } from 'lucide-react'

export default function DeleteBookButton({
  id,
  title,
  action,
}: {
  id: string
  title: string
  action: (formData: FormData) => void | Promise<void>
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1" style={{ color: '#f87171' }}>
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </button>
    </form>
  )
}
