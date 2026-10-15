import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Read.ify — South Africa\'s Ebook Marketplace',
    template: '%s | Read.ify',
  },
  description: 'Discover and download thousands of ebooks from South African and international publishers. Business, agriculture, self-development, technology and more.',
  keywords: ['ebooks', 'South Africa', 'digital books', 'ebook marketplace', 'buy ebooks', 'readify', 'read.ify'],
  authors: [{ name: 'Read.ify' }],
  creator: 'Read.ify',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://readify.co.za',
    siteName: 'Read.ify',
    title: 'Read.ify — South Africa\'s Ebook Marketplace',
    description: 'Discover and download thousands of ebooks from publishers and authors.',
    images: [{ url: '/logo-dark.png', width: 1200, height: 1200, alt: 'Read.ify' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Read.ify',
    description: 'South Africa\'s Ebook Marketplace',
    images: ['/logo-dark.png'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/logo-stacked.png', apple: '/logo-stacked.png' },
  themeColor: '#f5a623',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Prevent dark-mode flash on hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t?t==='dark':true);})()`,
          }}
        />
      </head>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
