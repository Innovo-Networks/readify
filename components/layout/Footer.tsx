import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, CreditCard, Wallet, Banknote } from 'lucide-react'
import { PAYFAST_ENABLED, PAYPAL_ENABLED } from '@/lib/payments'

export default function Footer() {
  return (
    <footer style={{ background: '#050810', color: 'rgba(249,250,251,0.5)' }}>
      <div className="page-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Brand ── */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300" style={{ width: 48, height: 48 }}>
                <Image src="/logo-mark-dark.png" alt="Read.ify logo" fill sizes="48px" className="object-contain" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight font-display">
                <span className="text-white">Read</span>
                <span className="text-gold-500">.</span>
                <span className="text-white">ify</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5">
              South Africa&apos;s premier ebook marketplace. Discover, purchase, and download
              thousands of ebooks from independent publishers and authors.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold-500 shrink-0" />
                <a href="mailto:support@innovonet.co.za" className="hover:text-white transition-colors">
                  support@innovonet.co.za
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-500 shrink-0" />
                <a href="tel:+27218113333" className="hover:text-white transition-colors">
                  021 811 3333
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-500 shrink-0" />
                <span>Century City, Cape Town</span>
              </div>
            </div>
          </div>

          {/* ── Browse ── */}
          <div>
            <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-4">Browse</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'All Ebooks',            href: '/books' },
                { label: 'Business & Finance',    href: '/books?category=business-finance' },
                { label: 'Agriculture & Science', href: '/books?category=agriculture-science' },
                { label: 'Entrepreneurship',      href: '/books?category=entrepreneurship' },
                { label: 'Self Development',      href: '/books?category=self-development' },
                { label: 'Technology',            href: '/books?category=technology' },
                { label: 'Featured Books',        href: '/books?featured=true' },
                { label: 'On Sale',               href: '/books?on_sale=true' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Publishers ── */}
          <div>
            <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-4">Publishers</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Become a Publisher',    href: '/publisher/register' },
                { label: 'Publisher Dashboard',   href: '/publisher/dashboard' },
                { label: 'Upload a Book',         href: '/publisher/dashboard/books/new' },
                { label: 'Commission Structure',  href: '/publisher/agreement' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Company ── */}
          <div>
            <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'How It Works',   href: '/how-it-works' },
                { label: 'Help Centre',    href: 'mailto:support@innovonet.co.za' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Refund Policy',  href: '/refunds' },
                { label: 'Cookie Policy', href: '/cookies' },
                { label: 'POPIA Notice',   href: '/popia' },
                { label: 'Publisher Agreement', href: '/publisher/agreement' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Payment icons */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>We accept:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: 'Visa',       icon: CreditCard, color: '#60a5fa' },
                { label: 'Mastercard', icon: CreditCard, color: '#f87171' },
                ...(PAYFAST_ENABLED ? [{ label: 'PayFast', icon: Banknote, color: '#34d399' }] : []),
                ...(PAYPAL_ENABLED ? [{ label: 'PayPal', icon: Wallet, color: '#34d399' }] : []),
              ].map((m) => (
                <span
                  key={m.label}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: m.color,
                  }}
                >
                  <m.icon className="w-3 h-3" />
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-center md:text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} Innovo Networks (Pty) Ltd, trading as Readify. All rights reserved.{' '}
            VAT-registered in South Africa. 15% VAT is added at checkout.
          </p>
        </div>
      </div>
    </footer>
  )
}
