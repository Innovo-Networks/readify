import type { LegalDocument as LegalDoc } from '@/lib/legal/documents'

/** Renders an approved legal document. Content comes from lib/legal/documents.ts. */
export default function LegalDocument({ doc }: { doc: LegalDoc }) {
  // Group consecutive bullet points into one list.
  const groups: Array<{ kind: 'h2' | 'p' | 'ul'; items: string[] }> = []
  for (const b of doc.blocks) {
    if (b.type === 'li') {
      const last = groups[groups.length - 1]
      if (last && last.kind === 'ul') last.items.push(b.text)
      else groups.push({ kind: 'ul', items: [b.text] })
    } else {
      groups.push({ kind: b.type, items: [b.text] })
    }
  }

  return (
    <div className="page-container py-16 max-w-3xl">
      <h1 className="font-display text-4xl font-bold mb-10" style={{ color: 'var(--text)' }}>
        {doc.title}
      </h1>
      <div className="space-y-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {groups.map((g, i) => {
          if (g.kind === 'h2') {
            return (
              <h2 key={i} className="font-display text-xl font-semibold pt-6" style={{ color: 'var(--text)' }}>
                {g.items[0]}
              </h2>
            )
          }
          if (g.kind === 'ul') {
            return (
              <ul key={i} className="list-disc pl-6 space-y-2">
                {g.items.map((t, j) => <li key={j}>{t}</li>)}
              </ul>
            )
          }
          return <p key={i}>{g.items[0]}</p>
        })}
      </div>
    </div>
  )
}
