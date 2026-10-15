import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import BookCard from '@/components/books/BookCard'
import {
  ArrowRight, BookOpen, ShieldCheck, Zap, Globe, Star, Upload, DollarSign, Users,
  TrendingUp, Leaf, Brain, Rocket, BarChart2, Cpu, Building2, Heart,
  CreditCard, Wallet, Download, CheckCircle,
} from 'lucide-react'
import type { Book } from '@/types'

async function getFeaturedBooks(): Promise<Book[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('books')
    .select('*, publishers(company_name, logo_url), categories(name, slug)')
    .eq('status', 'published')
    .eq('featured', true)
    .order('total_sales', { ascending: false })
    .limit(8)
  return (data as Book[]) || []
}

async function getNewReleases(): Promise<Book[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('books')
    .select('*, publishers(company_name), categories(name, slug)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(8)
  return (data as Book[]) || []
}

async function getOnSaleBooks(): Promise<Book[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('books')
    .select('*, publishers(company_name), categories(name, slug)')
    .eq('status', 'published')
    .eq('on_sale', true)
    .limit(4)
  return (data as Book[]) || []
}

const CATEGORIES = [
  { name: 'Business & Finance',   slug: 'business-finance',    icon: TrendingUp, color: 'from-blue-500/20 to-blue-600/10',   iconColor: '#60a5fa' },
  { name: 'Agriculture & Science',slug: 'agriculture-science',  icon: Leaf,       color: 'from-emerald-500/20 to-emerald-600/10', iconColor: '#34d399' },
  { name: 'Self Development',     slug: 'self-development',     icon: Brain,      color: 'from-purple-500/20 to-purple-600/10',  iconColor: '#a78bfa' },
  { name: 'Entrepreneurship',     slug: 'entrepreneurship',     icon: Rocket,     color: 'from-orange-500/20 to-orange-600/10',  iconColor: '#fb923c' },
  { name: 'Marketing & Sales',    slug: 'marketing-sales',      icon: BarChart2,  color: 'from-gold-500/20 to-gold-600/10',      iconColor: '#f5a623' },
  { name: 'Technology',           slug: 'technology',           icon: Cpu,        color: 'from-cyan-500/20 to-cyan-600/10',      iconColor: '#22d3ee' },
  { name: 'Real Estate',          slug: 'real-estate',          icon: Building2,  color: 'from-rose-500/20 to-rose-600/10',      iconColor: '#fb7185' },
  { name: 'Health & Wellness',    slug: 'health-wellness',      icon: Heart,      color: 'from-pink-500/20 to-pink-600/10',      iconColor: '#f472b6' },
  { name: 'Fiction',              slug: 'fiction',              icon: BookOpen,   color: 'from-violet-500/20 to-violet-600/10',  iconColor: '#8b5cf6' },
]

const TRUST_STATS = [
  { icon: ShieldCheck, label: 'Secure Payments',   desc: 'Bank-grade SSL on all transactions', color: '#10b981' },
  { icon: Zap,         label: 'Instant Download',  desc: 'Get your ebook within seconds',       color: '#f5a623' },
  { icon: Globe,       label: 'VAT Compliant',     desc: 'SA VAT registered, 15% incl.',        color: '#60a5fa' },
  { icon: BookOpen,    label: '100+ Ebooks',        desc: 'Growing catalog every week',          color: '#a78bfa' },
]

export default async function HomePage() {
  const [featuredBooks, newReleases, onSaleBooks] = await Promise.all([
    getFeaturedBooks(),
    getNewReleases(),
    getOnSaleBooks(),
  ])

  return (
    <div style={{ background: 'var(--bg)' }}>

      {/* ══════════════════════════════════════════
          CINEMATIC HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '92vh', background: 'linear-gradient(135deg, #050810 0%, #0a0f1e 50%, #111d3d 100%)' }}>

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute animate-orb-pulse rounded-full"
            style={{ width: 600, height: 600, top: '-15%', left: '-10%', background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute animate-orb-pulse-2 rounded-full"
            style={{ width: 500, height: 500, bottom: '-10%', right: '-5%', background: 'radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute animate-float-slow rounded-full"
            style={{ width: 300, height: 300, top: '30%', right: '15%', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

        <div className="page-container relative z-10 flex items-center" style={{ minHeight: '92vh' }}>
          <div className="py-24 max-w-3xl">

            {/* Logo lockup */}
            <div className="mb-10 animate-fade-in">
              <div className="relative overflow-hidden rounded-2xl inline-block shadow-[0_0_40px_rgba(245,166,35,0.2)]"
                style={{ width: 180, height: 100 }}>
                <Image
                  src="/logo-stacked-dark.png"
                  alt="Read.ify"
                  width={200}
                  height={281}
                  style={{ position: 'absolute', top: -52, left: 0 }}
                  priority
                />
              </div>
            </div>

            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 mb-6 animate-slide-up"
              style={{
                background: 'rgba(245,166,35,0.1)',
                border: '1px solid rgba(245,166,35,0.25)',
                borderRadius: 9999,
                padding: '6px 16px',
              }}>
              <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
              <span className="text-xs font-semibold text-gold-400 tracking-wide">
                South Africa&apos;s #1 Ebook Marketplace
              </span>
            </div>

            {/* Hero headline */}
            <h1 className="display-title text-5xl md:text-7xl mb-6 text-balance animate-slide-up leading-[1.1]"
              style={{ color: '#F9FAFB', animationDelay: '0.05s' }}>
              Discover &amp; Download<br />
              <span className="text-gold-gradient">Thousands of Ebooks</span>
            </h1>

            <p className="text-lg md:text-xl mb-10 max-w-2xl leading-relaxed animate-slide-up"
              style={{ color: 'rgba(249,250,251,0.65)', animationDelay: '0.1s' }}>
              South Africa&apos;s premier ebook marketplace — browse, purchase, and download
              instantly from publishers across the country and beyond.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <Link href="/books" className="btn-primary text-base px-8 py-4">
                Browse Library <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/publisher/register" className="btn-ghost text-base px-8 py-4">
                Start Selling <Upload className="w-5 h-5" />
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {[
                { icon: ShieldCheck, label: 'Secure Payments' },
                { icon: Zap, label: 'Instant Download' },
                { icon: Globe, label: 'VAT Registered' },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2">
                  <t.icon className="w-4 h-4 text-gold-500" />
                  <span className="text-sm font-medium" style={{ color: 'rgba(249,250,251,0.6)' }}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--bg))' }} />
      </section>


      {/* ══════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════ */}
      <section className="py-20" style={{ background: 'var(--bg)' }}>
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Browse by Category</h2>
            <p className="section-subtitle">Find your next great read across a wide range of topics</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.slug}
                  href={`/books?category=${cat.slug}`}
                  className="category-pill group"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `rgba(${cat.iconColor === '#f5a623' ? '245,166,35' : cat.iconColor === '#60a5fa' ? '96,165,250' : '255,255,255'},0.1)` }}>
                    <Icon className="w-5 h-5" style={{ color: cat.iconColor }} />
                  </div>
                  <span className="text-[10px] font-semibold text-center leading-tight"
                    style={{ color: 'rgba(249,250,251,0.7)' }}>
                    {cat.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          ON SALE STRIP
      ══════════════════════════════════════════ */}
      {onSaleBooks.length > 0 && (
        <section className="py-4" style={{ background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #b91c1c 100%)' }}>
          <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">Books on Sale!</p>
                <p className="text-red-100 text-sm">Limited-time discounts — grab them before they&apos;re gone</p>
              </div>
            </div>
            <Link
              href="/books?on_sale=true"
              className="shrink-0 flex items-center gap-2 bg-white text-red-600 font-bold px-6 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm"
            >
              Shop Sale <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}


      {/* ══════════════════════════════════════════
          FEATURED BOOKS
      ══════════════════════════════════════════ */}
      {featuredBooks.length > 0 && (
        <section className="py-20" style={{ background: 'var(--bg-raised)' }}>
          <div className="page-container">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 fill-gold-500 text-gold-500" />
                  <span className="text-xs font-semibold text-gold-500 uppercase tracking-widest">Curated</span>
                </div>
                <h2 className="section-title">Featured Books</h2>
                <p className="section-subtitle">Hand-picked by our editorial team</p>
              </div>
              <Link href="/books?featured=true" className="btn-secondary text-sm hidden sm:inline-flex">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ══════════════════════════════════════════
          NEW RELEASES
      ══════════════════════════════════════════ */}
      {newReleases.length > 0 && (
        <section className="py-20" style={{ background: 'var(--bg)' }}>
          <div className="page-container">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Just Added</span>
                </div>
                <h2 className="section-title">New Releases</h2>
                <p className="section-subtitle">Fresh ebooks added this week</p>
              </div>
              <Link href="/books?sort=newest" className="btn-secondary text-sm hidden sm:inline-flex">
                See All New <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
              {newReleases.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ══════════════════════════════════════════
          PUBLISHER CTA
      ══════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #111d3d 100%)' }}>
        {/* Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="page-container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-6"
              style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 9999, padding: '6px 16px' }}>
              <Upload className="w-3.5 h-3.5 text-gold-500" />
              <span className="text-xs font-semibold text-gold-400 tracking-wide">For Publishers & Authors</span>
            </div>
            <h2 className="display-title text-4xl md:text-5xl mb-4 text-white">
              Turn Your Knowledge<br />
              <span className="text-gold-gradient">Into Revenue</span>
            </h2>
            <p className="text-lg mb-12 max-w-2xl mx-auto" style={{ color: 'rgba(249,250,251,0.55)' }}>
              Join Readify&apos;s publisher marketplace. Upload your ebooks, set your prices, and
              start earning. We handle the platform, payments, and delivery — you focus on creating.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              {[
                { icon: Upload, title: 'Upload & Publish', desc: 'Upload PDFs in minutes. Set your price in ZAR and go live instantly.' },
                { icon: DollarSign, title: 'Earn 80%', desc: 'Keep 80% of every sale. We take just 20% as our platform commission.' },
                { icon: Users, title: 'Reach Readers', desc: 'Access our growing marketplace of engaged South African readers.' },
              ].map((f) => (
                <div key={f.title} className="glass-card p-6 text-left">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(245,166,35,0.12)' }}>
                    <f.icon className="w-5 h-5 text-gold-500" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(249,250,251,0.5)' }}>{f.desc}</p>
                </div>
              ))}
            </div>

            <Link href="/publisher/register" className="btn-primary text-base px-10 py-4">
              Start Selling Today <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          PAYMENT METHODS
      ══════════════════════════════════════════ */}
      <section className="py-20" style={{ background: 'var(--bg-raised)' }}>
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Flexible Payment Options</h2>
            <p className="section-subtitle">Pay the way that suits you</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                icon: CreditCard,
                title: 'Credit & Debit Card',
                desc: 'Visa, Mastercard, and all major cards — powered by Stripe with bank-grade 3D Secure.',
                tag: 'Most Popular',
                tagColor: '#60a5fa',
                iconColor: '#60a5fa',
              },
              {
                icon: Wallet,
                title: 'PayPal',
                desc: 'Pay securely with your PayPal balance or linked bank account. Buyer protection included.',
                tag: 'Safe & Trusted',
                tagColor: '#34d399',
                iconColor: '#34d399',
              },
              {
                icon: Globe,
                title: 'EFT / Bank Transfer',
                desc: 'Direct South African EFT via Peach Payments or direct bank transfer. All major SA banks.',
                tag: 'Local SA',
                tagColor: '#f5a623',
                iconColor: '#f5a623',
              },
            ].map((p) => (
              <div key={p.title} className="card p-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `rgba(${p.iconColor === '#60a5fa' ? '96,165,250' : p.iconColor === '#34d399' ? '52,211,153' : '245,166,35'},0.1)` }}>
                  <p.icon className="w-7 h-7" style={{ color: p.iconColor }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: p.tagColor }}>{p.tag}</span>
                <h3 className="text-base font-bold mt-1 mb-3" style={{ color: 'var(--text)' }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-subtle)' }}>
            All prices include 15% South African VAT. Secure SSL encryption on all transactions.
          </p>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          TRUST SIGNALS
      ══════════════════════════════════════════ */}
      <section className="py-16 border-t" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {TRUST_STATS.map((t) => (
              <div key={t.label}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: `rgba(255,255,255,0.04)`, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <t.icon className="w-7 h-7" style={{ color: t.color }} />
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>{t.label}</h3>
                <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          HOW IT WORKS (buyer steps)
      ══════════════════════════════════════════ */}
      <section className="py-20" style={{ background: 'var(--bg-raised)' }}>
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">How It Works</h2>
            <p className="section-subtitle">Get reading in under 2 minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: '01', icon: BookOpen,    title: 'Browse & Choose', desc: 'Explore thousands of ebooks across categories and find your next great read.' },
              { step: '02', icon: CreditCard,  title: 'Secure Checkout', desc: 'Pay safely with card, PayPal, or EFT. 15% SA VAT included in all prices.' },
              { step: '03', icon: Download,    title: 'Instant Download', desc: 'Get immediate access to your ebook. Download to any device, anytime.' },
            ].map((s) => (
              <div key={s.step} className="glass-card p-6 relative">
                <span className="absolute top-4 right-5 text-5xl font-black opacity-[0.04]"
                  style={{ fontFamily: '"Playfair Display", serif', color: '#f5a623', lineHeight: 1 }}>
                  {s.step}
                </span>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(245,166,35,0.1)' }}>
                  <s.icon className="w-6 h-6 text-gold-500" />
                </div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(249,250,251,0.5)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
