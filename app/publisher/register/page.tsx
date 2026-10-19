'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  isValidVatNumber, isValidCipcNumber, isValidAccountNumber, isValidBranchCode,
  documentError, documentExtension,
} from '@/lib/publisher-validation'
import {
  Loader2, Building2, Phone, Globe, MapPin, Hash, FileText, Check,
  BookOpen, Banknote, Upload, TrendingUp, Users,
} from 'lucide-react'

const SA_PROVINCES = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
  'Limpopo','Mpumalanga','Northern Cape','North West','Western Cape',
]
const SA_BANKS = [
  'ABSA','FNB (First National Bank)','Nedbank','Standard Bank',
  'Capitec','African Bank','Investec','TymeBank','Discovery Bank',
]

const STEPS = [
  { n: 1, label: 'Business Info',    icon: Building2 },
  { n: 2, label: 'Contact & Address', icon: MapPin    },
  { n: 3, label: 'Banking Details',  icon: Banknote  },
]

export default function PublisherRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [files, setFiles] = useState<{ cipc?: File; bank?: File; vat?: File }>({})

  const [form, setForm] = useState({
    company_name: '',
    vat_number: '',
    cipc_registration: '',
    physical_address: '',
    city: '',
    province: '',
    postal_code: '',
    phone: '',
    website: '',
    bio: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_type: 'Cheque',
    bank_branch_code: '',
  })

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  // Returns the first problem with the fields on a step, or null when the step is complete.
  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (form.vat_number && !isValidVatNumber(form.vat_number)) return 'VAT number must be 10 digits starting with 4.'
      if (!isValidCipcNumber(form.cipc_registration)) return 'CIPC number must look like 2023/123456/07.'
      if (!files.cipc) return 'Upload your CIPC registration certificate.'
      if (form.vat_number && !files.vat) return 'Upload your VAT registration letter.'
    }
    if (s === 3) {
      if (!isValidAccountNumber(form.bank_account_number)) return 'Account number must be 6 to 16 digits.'
      if (!isValidBranchCode(form.bank_branch_code)) return 'Branch code must be 6 digits.'
      if (!files.bank) return 'Upload your bank letter.'
    }
    return null
  }

  const pickFile = (kind: 'cipc' | 'bank' | 'vat', file: File | undefined) => {
    if (!file) return
    const problem = documentError(file)
    if (problem) { setError(problem); return }
    setError('')
    setFiles((f) => ({ ...f, [kind]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const problem = validateStep(1) ?? validateStep(3)
    if (problem) { setError(problem); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login?redirect=/publisher/register'); return }

    // Documents are stored under <user id>/ in a private bucket, so only this publisher and admins can read them.
    const uploadDocument = async (kind: string, file: File | undefined) => {
      if (!file) return null
      const path = `${user.id}/${kind}-${Date.now()}.${documentExtension(file.type)}`
      const { error: uploadError } = await supabase.storage
        .from('publisher-documents')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError
      return path
    }

    let documentPaths: { cipc: string | null; bank: string | null; vat: string | null }
    try {
      documentPaths = {
        cipc: await uploadDocument('cipc', files.cipc),
        bank: await uploadDocument('bank', files.bank),
        vat: await uploadDocument('vat', files.vat),
      }
    } catch {
      setError('We could not upload your documents. Please try again.')
      setLoading(false)
      return
    }

    await supabase.from('profiles').update({ role: 'publisher' }).eq('id', user.id)

    // publishers.id is the profile id (see supabase/schema.sql), and the columns match that schema.
    const { error: pubError } = await supabase.from('publishers').upsert({
      id: user.id,
      company_name: form.company_name,
      vat_number: form.vat_number || null,
      cipc_registration: form.cipc_registration || null,
      physical_address: form.physical_address,
      city: form.city,
      province: form.province,
      postal_code: form.postal_code,
      phone: form.phone || null,
      website: form.website || null,
      bio: form.bio || null,
      bank_name: form.bank_name,
      bank_account_number: form.bank_account_number,
      bank_account_type: form.bank_account_type,
      cipc_document_path: documentPaths.cipc,
      bank_letter_path: documentPaths.bank,
      vat_letter_path: documentPaths.vat,
      bank_branch_code: form.bank_branch_code,
      status: 'pending',
    }, { onConflict: 'id', ignoreDuplicates: false })

    if (pubError) { setError(pubError.message); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="max-w-md w-full text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}
          >
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--text)' }}>
            Application Submitted!
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
            Thank you for applying to become a Readify publisher. Our team will review your application
            within <strong style={{ color: 'var(--gold)' }}>2–3 business days</strong> and notify you by email.
          </p>
          <div
            className="rounded-xl p-4 text-sm mb-8"
            style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: 'var(--gold)' }}
          >
            While you wait, you can explore the platform and prepare your first ebooks for upload.
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/" className="btn-secondary">Back to Home</Link>
            <Link href="/publisher/dashboard" className="btn-primary">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Hero header */}
      <div style={{ background: 'linear-gradient(135deg, #050810 0%, #0a0f1e 60%, #111d3d 100%)', position: 'relative', overflow: 'hidden' }}>
        <div className="absolute rounded-full pointer-events-none animate-orb-pulse" style={{ width: 500, height: 500, top: '-20%', right: '-10%', background: 'radial-gradient(circle, rgba(245,166,35,0.1) 0%, transparent 70%)' }} />

        <div className="page-container max-w-3xl py-12 relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <BookOpen className="w-7 h-7 text-gold-500" />
            <span className="font-display text-xl font-bold text-white">
              Read<span className="text-gold-500">.</span>ify
            </span>
          </Link>

          <h1 className="font-display text-4xl font-bold text-white mb-3">Become a Publisher</h1>
          <p className="text-lg mb-4" style={{ color: 'rgba(249,250,251,0.6)' }}>
            Join our marketplace and start earning from your knowledge. Keep 80% of every sale.
          </p>

          {/* Benefits row */}
          <div className="flex flex-wrap gap-4 mb-10">
            {[
              { icon: TrendingUp, text: '80% revenue share' },
              { icon: Upload,     text: 'Instant publishing' },
              { icon: Users,      text: 'SA reader audience' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(249,250,251,0.6)' }}>
                <Icon className="w-4 h-4 text-gold-500" /> {text}
              </div>
            ))}
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon
              const done    = step > s.n
              const active  = step === s.n
              return (
                <div key={s.n} className="flex items-center gap-2">
                  {i > 0 && (
                    <div className="w-6 h-px mx-1" style={{ background: done ? 'rgba(245,166,35,0.6)' : 'rgba(255,255,255,0.15)' }} />
                  )}
                  <button
                    type="button"
                    onClick={() => done && setStep(s.n)}
                    disabled={!done}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: active ? 'linear-gradient(135deg, #f5a623, #d97706)' : done ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.06)',
                      color:      active ? '#0a0f1e' : done ? '#f5a623' : 'rgba(255,255,255,0.4)',
                      border:     done && !active ? '1px solid rgba(245,166,35,0.3)' : 'none',
                      cursor:     done ? 'pointer' : 'default',
                    }}
                  >
                    {done ? <Check className="w-3 h-3" /> : <StepIcon className="w-3 h-3" />}
                    {s.label}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="page-container max-w-3xl py-10">
        {error && (
          <div className="rounded-xl px-4 py-3 mb-6 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}
        <form onSubmit={step < 3 ? (e) => { e.preventDefault(); const problem = validateStep(step); setError(problem ?? ''); if (!problem) setStep(step + 1) } : handleSubmit}>

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="rounded-2xl p-8 space-y-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div>
                <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-1" style={{ color: 'var(--text)' }}>
                  <Building2 className="w-5 h-5 text-gold-500" /> Business Information
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Required for VAT compliance and publisher verification.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Company / Publisher Name <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input className="input" placeholder="e.g. Smith Publishing (Pty) Ltd" value={form.company_name}
                  onChange={(e) => update('company_name', e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 text-gold-500" /> VAT Number</span>
                    <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-subtle)' }}>(optional)</span>
                  </label>
                  <input className="input font-mono" placeholder="4XXXXXXXXX" maxLength={10} value={form.vat_number}
                    onChange={(e) => update('vat_number', e.target.value.replace(/\D/g, ''))} />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>10 digits starting with 4</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-gold-500" /> CIPC Number</span>
                    <span style={{ color: '#f87171' }}> *</span>
                  </label>
                  <input className="input font-mono" placeholder="2023/123456/07" value={form.cipc_registration}
                    onChange={(e) => update('cipc_registration', e.target.value)} />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Companies & Intellectual Property Commission</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    CIPC Registration Certificate <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm"
                    onChange={(e) => pickFile('cipc', e.target.files?.[0])} />
                  {files.cipc && <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>{files.cipc.name}</p>}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>PDF, JPG or PNG, up to 5 MB</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    VAT Registration Letter
                    <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-subtle)' }}>(required with a VAT number)</span>
                  </label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm"
                    onChange={(e) => pickFile('vat', e.target.files?.[0])} />
                  {files.vat && <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>{files.vat.name}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  About Your Publishing House
                </label>
                <textarea
                  className="input resize-none"
                  style={{ minHeight: 100 }}
                  placeholder="Tell readers about your publishing house, the types of books you publish…"
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-primary">
                  Continue: Contact Details →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Contact & Location */}
          {step === 2 && (
            <div className="rounded-2xl p-8 space-y-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div>
                <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-1" style={{ color: 'var(--text)' }}>
                  <MapPin className="w-5 h-5 text-gold-500" /> Contact & Address
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Your business address and contact information.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Physical Address <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input className="input" placeholder="123 Main Street" value={form.physical_address}
                  onChange={(e) => update('physical_address', e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>City <span style={{ color: '#f87171' }}>*</span></label>
                  <input className="input" placeholder="Cape Town" value={form.city}
                    onChange={(e) => update('city', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Province <span style={{ color: '#f87171' }}>*</span></label>
                  <select className="input" value={form.province} onChange={(e) => update('province', e.target.value)} required>
                    <option value="">Select province</option>
                    {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Postal Code <span style={{ color: '#f87171' }}>*</span></label>
                  <input className="input font-mono" placeholder="8001" value={form.postal_code}
                    onChange={(e) => update('postal_code', e.target.value.replace(/\D/g, ''))} maxLength={4} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Country</label>
                  <input className="input opacity-60" value="South Africa" readOnly />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Phone className="w-3.5 h-3.5 inline mr-1 text-gold-500" />
                    Phone Number <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input className="input" placeholder="0XX XXX XXXX" value={form.phone}
                    onChange={(e) => update('phone', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Globe className="w-3.5 h-3.5 inline mr-1 text-gold-500" />
                    Website <span className="text-xs font-normal" style={{ color: 'var(--text-subtle)' }}>(optional)</span>
                  </label>
                  <input type="url" className="input" placeholder="https://yoursite.co.za" value={form.website}
                    onChange={(e) => update('website', e.target.value)} />
                </div>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="btn-ghost">← Back</button>
                <button type="submit" className="btn-primary">Continue: Banking Details →</button>
              </div>
            </div>
          )}

          {/* Step 3: Banking */}
          {step === 3 && (
            <div className="rounded-2xl p-8 space-y-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div>
                <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-1" style={{ color: 'var(--text)' }}>
                  <Banknote className="w-5 h-5 text-gold-500" /> Banking Details
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Your banking information for monthly payout of your earnings.
                </p>
              </div>

              {/* Earnings callout */}
              <div
                className="rounded-xl p-4 text-sm flex items-center gap-3"
                style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}
              >
                <TrendingUp className="w-5 h-5 text-gold-500 shrink-0" />
                <span style={{ color: 'var(--gold)' }}>
                  You earn <strong>80% of every sale</strong>. Readify retains 20% as platform commission. Payouts processed monthly.
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Bank Name <span style={{ color: '#f87171' }}>*</span>
                </label>
                <select className="input" value={form.bank_name} onChange={(e) => update('bank_name', e.target.value)} required>
                  <option value="">Select bank</option>
                  {SA_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Account Number <span style={{ color: '#f87171' }}>*</span></label>
                  <input className="input font-mono" placeholder="000000000000" value={form.bank_account_number}
                    onChange={(e) => update('bank_account_number', e.target.value.replace(/\D/g, ''))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Account Type <span style={{ color: '#f87171' }}>*</span></label>
                  <select className="input" value={form.bank_account_type} onChange={(e) => update('bank_account_type', e.target.value)}>
                    <option>Cheque</option>
                    <option>Savings</option>
                    <option>Transmission</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Branch Code <span style={{ color: '#f87171' }}>*</span></label>
                <input className="input font-mono w-48" placeholder="250655" value={form.bank_branch_code}
                  onChange={(e) => update('bank_branch_code', e.target.value.replace(/\D/g, ''))} maxLength={6} required />
                <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
                  Universal branch codes: ABSA 632005 · FNB 250655 · Standard Bank 051001 · Nedbank 198765 · Capitec 470010
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Bank Letter <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm"
                  onChange={(e) => pickFile('bank', e.target.files?.[0])} />
                {files.bank && <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>{files.bank.name}</p>}
                <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
                  A bank letter or recent statement showing the account holder name, account number and branch code.
                  PDF, JPG or PNG, up to 5 MB.
                </p>
              </div>

              <div
                className="rounded-xl p-4 text-xs flex items-center gap-2"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-subtle)' }}
              >
                🔒 Your banking details are stored securely and only used for payout purposes.
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(2)} className="btn-ghost">← Back</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
