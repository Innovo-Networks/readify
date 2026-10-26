import type { Metadata } from 'next'
import LegalDocument from '@/components/legal/LegalDocument'
import { LEGAL_DOCUMENTS } from '@/lib/legal/documents'

const doc = LEGAL_DOCUMENTS.cookies

export const metadata: Metadata = { title: doc.title }

export default function Page() {
  return <LegalDocument doc={doc} />
}
