'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import {
  Upload, ArrowLeft, Loader2, BookOpen, Image as ImageIcon,
  Tag, DollarSign, Flame, Star, Check,
} from 'lucide-react'

const CATEGORIES = [
  { id: 'business-finance',  name: 'Business & Finance' },
  { id: 'agriculture-science', name: 'Agriculture & Science' },
  { id: 'entrepreneurship',  name: 'Entrepreneurship' },
  { id: 'self-development',  name: 'Self Development' },
  { id: 'marketing-sales',   name: 'Marketing & Sales' },
  { id: 'technology',        name: 'Technology' },
  { id: 'real-estate',       name: 'Real Estate' },
  { id: 'fiction',           name: 'Fiction' },
  { id: 'health-wellness',   name: 'Health & Wellness' },
  { id: 'other',             name: 'Other' },
]

const LANGUAGES = ['English', 'Afrikaans', 'Zulu', 'Xhosa', 'Sotho', 'Other']

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h2 className="font-semibold flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
        <Icon className="w-4 h-4 text-gold-500" /> {title}
      </h2>
      {children}
    </div>
  )
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {children}
      {optional && <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-subtle)' }}>(optional)</span>}
    </label>
  )
}

export default function NewBookPage() {
  const router  = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')
  const [coverPreview,   setCoverPreview]   = useState<string | null>(null)
  const [coverFileName,  setCoverFileName]  = useState('')
  const [fileFileName,   setFileFileName]   = useState('')
  const [uploadProgress, setUploadProgress] = useState('')

  const [form, setForm] = useState({
    title: '', subtitle: '', author: '', description: '', isbn: '',
    language: 'English', pages: '', publication_date: '',
    category_slug: '', tags: '',
    price: '', original_price: '', on_sale: false,
    featured: false, status: 'draft' as 'draft' | 'published',
    drive_file_id: '',
  })

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }))

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverPreview(URL.createObjectURL(file))
      setCoverFileName(file.name)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFileFileName(file.name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: publisher } = await supabase.from('publishers').select('id, status').eq('id', user.id).single()
      if (!publisher || publisher.status !== 'approved') {
        throw new Error('Your publisher account must be approved before uploading books.')
      }

      let coverUrl: string | null = null
      let fileUrl:  string | null = null

      const coverFile = coverRef.current?.files?.[0]
      if (coverFile) {
        setUploadProgress('Uploading cover image…')
        const coverPath = `covers/${user.id}/${Date.now()}-${coverFile.name}`
        const { error: coverErr } = await supabase.storage.from('covers').upload(coverPath, coverFile, { upsert: true })
        if (coverErr) throw new Error('Cover upload failed: ' + coverErr.message)
        const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(coverPath)
        coverUrl = publicUrl
      }

      const ebookFile = fileRef.current?.files?.[0]
      if (ebookFile) {
        setUploadProgress('Uploading ebook file…')
        const filePath = `ebooks/${user.id}/${Date.now()}-${ebookFile.name}`
        const { error: fileErr } = await supabase.storage.from('ebooks').upload(filePath, ebookFile, { upsert: true })
        if (fileErr) throw new Error('File upload failed: ' + fileErr.message)
        fileUrl = filePath
      }

      const { data: cat } = await supabase.from('categories').select('id').eq('slug', form.category_slug).single()
      const slug = slugify(form.title) + '-' + Date.now().toString(36)
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)

      setUploadProgress('Saving book details…')
      const { error: bookErr } = await supabase.from('books').insert({
        publisher_id:  publisher.id,
        category_id:   cat?.id || null,
        title:         form.title,
        slug,
        author:        form.author || null,
        description:   form.description || null,
        isbn:          form.isbn || null,
        language:      form.language,
        pages:         form.pages ? parseInt(form.pages) : null,
        cover_url:     coverUrl,
        file_url:      fileUrl,
        price:         parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        on_sale:       form.on_sale,
        featured:      form.featured,
        status:        form.status,
        tags,
        currency:      'ZAR',
      })

      if (bookErr) throw new Error(bookErr.message)
      router.push('/publisher/dashboard')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container py-5 flex items-center gap-4">
          <Link
            href="/publisher/dashboard"
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-subtle)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>Upload New Book</h1>
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>Add a new ebook to your catalog</p>
          </div>
        </div>
      </div>

      <div className="page-container max-w-4xl py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main form */}
            <div className="lg:col-span-2 space-y-5">
              <SectionCard title="Book Details" icon={BookOpen}>
                <div>
                  <FieldLabel>Title *</FieldLabel>
                  <input className="input" placeholder="Enter book title" value={form.title}
                    onChange={(e) => update('title', e.target.value)} required />
                </div>
                <div>
                  <FieldLabel optional>Subtitle</FieldLabel>
                  <input className="input" placeholder="Optional subtitle" value={form.subtitle}
                    onChange={(e) => update('subtitle', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Author *</FieldLabel>
                    <input className="input" placeholder="Author name" value={form.author}
                      onChange={(e) => update('author', e.target.value)} required />
                  </div>
                  <div>
                    <FieldLabel>Language</FieldLabel>
                    <select className="input" value={form.language} onChange={(e) => update('language', e.target.value)}>
                      {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel optional>Pages</FieldLabel>
                    <input type="number" className="input" placeholder="250" value={form.pages}
                      onChange={(e) => update('pages', e.target.value)} min="1" />
                  </div>
                  <div>
                    <FieldLabel optional>ISBN</FieldLabel>
                    <input className="input font-mono" placeholder="978-0-000-00000-0" value={form.isbn}
                      onChange={(e) => update('isbn', e.target.value)} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Description *</FieldLabel>
                  <textarea
                    className="input resize-none"
                    style={{ minHeight: 140 }}
                    placeholder="Write a compelling description of your ebook…"
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    rows={5}
                    required
                  />
                </div>
              </SectionCard>

              <SectionCard title="Category & Tags" icon={Tag}>
                <div>
                  <FieldLabel>Category *</FieldLabel>
                  <select className="input" value={form.category_slug}
                    onChange={(e) => update('category_slug', e.target.value)} required>
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel optional>Tags (comma-separated)</FieldLabel>
                  <input className="input" placeholder="e.g. investing, wealth, finance, south africa"
                    value={form.tags} onChange={(e) => update('tags', e.target.value)} />
                </div>
              </SectionCard>

              <SectionCard title="Pricing (ZAR)" icon={DollarSign}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Price *</FieldLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--gold)' }}>R</span>
                      <input type="number" className="input pl-7" placeholder="149.00" step="0.01" min="0"
                        value={form.price} onChange={(e) => update('price', e.target.value)} required />
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Price includes 15% VAT</p>
                  </div>
                  <div>
                    <FieldLabel optional>Original Price (for sale display)</FieldLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--text-subtle)' }}>R</span>
                      <input type="number" className="input pl-7" placeholder="199.00" step="0.01" min="0"
                        value={form.original_price} onChange={(e) => update('original_price', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  {[
                    { field: 'on_sale', label: 'On Sale', icon: Flame, color: '#f87171' },
                    { field: 'featured', label: 'Request Featured', icon: Star, color: 'var(--gold)' },
                  ].map(({ field, label, icon: Icon, color }) => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center"
                        style={{
                          background: (form as any)[field] ? color : 'var(--surface-2)',
                          border: (form as any)[field] ? `1.5px solid ${color}` : '1.5px solid var(--border)',
                        }}
                      >
                        {(form as any)[field] && <Check className="w-2.5 h-2.5 text-navy-900" strokeWidth={3} />}
                      </div>
                      <span
                        className="flex items-center gap-1 text-sm font-medium"
                        style={{ color: 'var(--text-muted)' }}
                        onClick={() => update(field, !(form as any)[field])}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Google Drive File (alternative to upload)" icon={Upload}>
                <div>
                  <FieldLabel optional>Google Drive File ID</FieldLabel>
                  <input className="input font-mono" placeholder="e.g. 1nODgTnqPkQ4D4fws7Byz..."
                    value={form.drive_file_id} onChange={(e) => update('drive_file_id', e.target.value)} />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
                    Extract from URL: drive.google.com/file/d/<strong style={{ color: 'var(--gold)' }}>FILE_ID</strong>/view
                  </p>
                </div>
              </SectionCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Cover upload */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <ImageIcon className="w-4 h-4 text-gold-500" /> Book Cover
                </h3>
                <div
                  onClick={() => coverRef.current?.click()}
                  className="rounded-xl overflow-hidden cursor-pointer transition-all"
                  style={{
                    border: `2px dashed ${coverPreview ? 'var(--gold)' : 'var(--border)'}`,
                    aspectRatio: '3/4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-raised)',
                  }}
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-subtle)' }} />
                      <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Click to upload</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)', opacity: 0.6 }}>JPG, PNG · 3:4 ratio</p>
                    </div>
                  )}
                </div>
                {coverFileName && (
                  <p className="text-xs mt-2 truncate" style={{ color: 'var(--text-subtle)' }}>{coverFileName}</p>
                )}
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </div>

              {/* PDF upload */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Upload className="w-4 h-4 text-gold-500" /> Ebook File (PDF/EPUB)
                </h3>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl p-5 cursor-pointer transition-all text-center"
                  style={{
                    border: `2px dashed ${fileFileName ? 'rgba(245,166,35,0.4)' : 'var(--border)'}`,
                    background: 'var(--bg-raised)',
                  }}
                >
                  <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: fileFileName ? 'var(--gold)' : 'var(--text-subtle)' }} />
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {fileFileName || 'Click to upload PDF / EPUB'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Max 100MB</p>
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.epub,.mobi" className="hidden" onChange={handleFileChange} />
              </div>

              {/* Publication status */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Publication Status</h3>
                <div className="space-y-2">
                  {([
                    { value: 'draft',     label: 'Save as Draft',  desc: 'Not visible to buyers yet' },
                    { value: 'published', label: 'Publish Now',    desc: 'Live and visible to buyers' },
                  ] as const).map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        border: form.status === opt.value ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                        background: form.status === opt.value ? 'rgba(245,166,35,0.06)' : 'transparent',
                      }}
                      onClick={() => update('status', opt.value)}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: form.status === opt.value ? 'var(--gold)' : 'var(--border)' }}
                      >
                        {form.status === opt.value && (
                          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{opt.label}</p>
                        <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {error}
                </div>
              )}
              {uploadProgress && (
                <p className="text-xs text-center" style={{ color: 'var(--gold)' }}>{uploadProgress}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                ) : 'Upload Book'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
