# Readify — Setup Guide

## Tech Stack
- **Frontend/Backend**: Next.js 14 (App Router + TypeScript)
- **Database + Auth + Storage**: Supabase
- **Payments**: Stripe (card) · PayPal · Coinbase Commerce (crypto)
- **Styling**: Tailwind CSS
- **Country**: South Africa | Currency: ZAR | VAT: 15% | CIPC registration

---

## 1. Clone & Install

```bash
cd readify
npm install
```

---

## 2. Supabase Setup

> **Current project (Oct 2026):** `innovo's Project`, ref `fqoikovjipnjywzbnvpa`, region eu-west-1,
> URL `https://fqoikovjipnjywzbnvpa.supabase.co`. `schema.sql` and the storage buckets below were
> applied on 2026-10-15 as migrations `readify_initial_schema` and `readify_storage_buckets`.
> For a fresh project, follow the steps below.

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. Go to **Storage** → create three buckets (or run the bucket SQL at the end of `schema.sql`):
   - `ebooks` — **private** (ebook PDFs)
   - `covers` — **public** (book cover images)
   - `logos` — **public** (publisher logos)
4. Copy your project URL and keys

---

## 3. Environment Variables

Copy `.env.example` → `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_PAYPAL_CLIENT_ID=AX...
PAYPAL_SECRET=EL...
PAYPAL_BASE_URL=https://api-m.paypal.com

COINBASE_COMMERCE_API_KEY=xxxxx
COINBASE_WEBHOOK_SECRET=xxxxx

NEXT_PUBLIC_APP_URL=https://readify.co.za
```

---

## 4. Payment Provider Setup

### Stripe
1. Register at [stripe.com](https://stripe.com) — South Africa supported ✓
2. Get API keys from Dashboard → Developers
3. Set webhook endpoint: `https://readify.co.za/api/stripe/webhook`
4. Events to listen for: `checkout.session.completed`, `payment_intent.payment_failed`

### PayPal
1. Register at [developer.paypal.com](https://developer.paypal.com)
2. Create an App → get Client ID and Secret
3. Set return URL: `https://readify.co.za/checkout/success`

### Coinbase Commerce
1. Register at [commerce.coinbase.com](https://commerce.coinbase.com)
2. Get API key from Settings → API Keys
3. Set webhook: `https://readify.co.za/api/coinbase/webhook`
4. Events: `charge:confirmed`, `charge:resolved`

---

## 5. Seed Ebook Catalog from Google Drive

After creating your publisher account and getting approved as admin:

```bash
# Set your publisher UUID in .env.local
SEED_PUBLISHER_ID=your-publisher-uuid-here

# Run the seeding script
npx tsx supabase/seed-drive-catalog.ts
```

**Important**: Update the `driveFileId` values in `seed-drive-catalog.ts` with the actual file IDs from your Drive folders. The file IDs are the long alphanumeric strings in the Google Drive share URLs.

Your existing Drive folder IDs:
- Agriculture & Science: `135Ves3lqnArNMzX9Iz0gNloqfLBnasJ9`
- Business & Finance: `1Gk2p0mLKEGOc9z8jFzPt-_rmfkwm4Z_q`
- Entrepreneurship: `1VOpAQf97Qc4lLDmDpGs2CM-J5jX0Uz6J`

---

## 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 7. First-Time Admin Setup

1. Register a user account on Readify
2. In Supabase Dashboard → Table Editor → `profiles`
3. Find your user and change `role` from `buyer` to `admin`
4. Log in — you'll now see the Admin Panel link

---

## 8. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo to Vercel and set the environment variables in the Vercel Dashboard.

---

## File Structure

```
readify/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── books/page.tsx                    # Catalog with filters/search
│   ├── books/[slug]/page.tsx             # Book detail + purchase
│   ├── cart/page.tsx                     # Shopping cart
│   ├── checkout/page.tsx                 # Checkout (Stripe/PayPal/Crypto)
│   ├── checkout/success/page.tsx         # Post-purchase downloads
│   ├── auth/login + register             # Authentication
│   ├── account/page.tsx                  # Buyer: my library + orders
│   ├── publisher/register/page.tsx       # Publisher onboarding (CIPC/VAT)
│   ├── publisher/dashboard/              # Publisher: books, sales, earnings
│   ├── admin/dashboard/                  # Admin: publishers, books, orders
│   └── api/
│       ├── stripe/checkout + webhook     # Stripe payment processing
│       ├── paypal/create + capture       # PayPal payment processing
│       ├── coinbase/create + webhook     # Crypto payment processing
│       └── download/[token]              # Secure ebook downloads
├── components/
│   ├── layout/Navbar.tsx + Footer.tsx    # Site navigation
│   ├── books/BookCard.tsx                # Ebook card component
│   └── cart/CartProvider.tsx             # Cart state (localStorage)
├── lib/
│   ├── supabase/client.ts + server.ts    # Supabase clients
│   ├── stripe.ts                         # Stripe helpers
│   ├── paypal.ts                         # PayPal helpers
│   ├── coinbase.ts                       # Coinbase Commerce helpers
│   └── utils.ts                          # ZAR formatting, VAT calc
├── types/index.ts                        # TypeScript types
└── supabase/
    ├── schema.sql                        # Full database schema
    └── seed-drive-catalog.ts             # Seed from Google Drive
```

---

## Publisher Business Info Collected

When publishers register, Readify collects:
- ✅ Company Name
- ✅ VAT Number (South African, 10 digits starting with 4)
- ✅ CIPC Registration Number (Companies and Intellectual Property Commission)
- ✅ Physical Address (street, city, province, postal code)
- ✅ Contact Details (phone, email, website)
- ✅ Banking Details (for monthly payouts at 80% of sales)

## Commission Structure
- Publishers earn **80%** of every sale
- Readify retains **20%** platform commission
- Payouts processed monthly via EFT to registered SA bank account
