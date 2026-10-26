import type { Book, Category, Publisher } from '@/types'

// Google Drive thumbnail URL for a file
const thumb = (id: string) => `https://lh3.googleusercontent.com/d/${id}`
const driveUrl = (id: string) => `https://drive.google.com/file/d/${id}/view`

function slug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
}

const DEMO_PUBLISHER: Publisher = {
  id: 'seed-pub-0001',
  company_name: 'Readify Publishers',
  vat_number: null,
  cipc_registration: null,
  physical_address: null,
  city: null,
  province: null,
  postal_code: null,
  country: 'ZA',
  phone: null,
  website: null,
  bio: null,
  logo_url: null,
  status: 'approved',
  rejection_reason: null,
  commission_rate: 0.8,
  total_earnings: 0,
  total_books: 0,
  approved_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const SEED_CATEGORIES: Category[] = [
  { id: 'seed-cat-bf', name: 'Business & Finance', slug: 'business-finance', description: 'Business strategy, financial literacy, and wealth building', icon: null, parent_id: null, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-cat-mk', name: 'Marketing & Sales', slug: 'marketing-sales', description: 'Digital marketing, email campaigns, social media and sales', icon: null, parent_id: null, sort_order: 2, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-cat-en', name: 'Entrepreneurship', slug: 'entrepreneurship', description: 'Start and grow your business with proven frameworks', icon: null, parent_id: null, sort_order: 3, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-cat-aq', name: 'Acquisitions & SaaS', slug: 'acquisitions-saas', description: 'Buy, sell, and scale online businesses and SaaS companies', icon: null, parent_id: null, sort_order: 4, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-cat-pd', name: 'Personal Development', slug: 'personal-development', description: 'Mindset, productivity, leadership, and self-improvement', icon: null, parent_id: null, sort_order: 5, created_at: '2024-01-01T00:00:00Z' },
]

const [CAT_BF, CAT_MK, CAT_EN, CAT_AQ, CAT_PD] = SEED_CATEGORIES

type Opts = {
  originalPrice?: number
  featured?: boolean
  onSale?: boolean
  rating?: number
  reviews?: number
  tags?: string[]
  description?: string
}

let _seq = 1
function book(driveId: string, title: string, cat: Category, price: number, opts: Opts = {}): Book {
  const n = _seq++
  const id = `seed-${String(n).padStart(4, '0')}`
  return {
    id,
    publisher_id: DEMO_PUBLISHER.id,
    category_id: cat.id,
    title,
    slug: slug(title),
    subtitle: null,
    description: opts.description ?? `A comprehensive guide to ${title.toLowerCase()}.`,
    author: null,
    isbn: null,
    language: 'English',
    pages: null,
    publication_date: null,
    cover_url: thumb(driveId),
    file_url: driveUrl(driveId),
    drive_file_id: driveId,
    sample_url: null,
    price,
    original_price: opts.originalPrice ?? null,
    currency: 'ZAR',
    status: 'published',
    featured: opts.featured ?? false,
    on_sale: opts.onSale ?? false,
    sale_ends_at: null,
    tags: opts.tags ?? [],
    total_sales: 0,
    total_revenue: 0,
    rating: opts.rating ?? 4.3,
    review_count: opts.reviews ?? 20,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    publishers: DEMO_PUBLISHER,
    categories: cat,
  }
}

export const SEED_BOOKS: Book[] = [
  // ── BUSINESS & FINANCE ──
  book('1tDquYwTIcmPosFMpr8nNLponjZ8dx-uE', 'How to DeFi Advanced Strategies', CAT_BF, 199, {
    description: 'Take your DeFi knowledge to the next level with advanced trading strategies, liquidity provision, and protocol analysis.',
    tags: ['defi', 'crypto', 'advanced'], rating: 4.8, reviews: 21,
  }),
  book('1oOmoLwRQmj5BP9OkT9MA3IO--T6SZDy8', 'Cold Hard Truth On Business Money and Life', CAT_BF, 169, {
    description: 'A no-nonsense guide to mastering money, building successful businesses, and living life on your terms.',
    tags: ['business', 'money', 'lifestyle'], featured: true, rating: 4.7, reviews: 58,
  }),
  book('15OVo1bBL8laDw-bADDxxf7n3ytrf_Ake', 'Modern Millionaires', CAT_BF, 129, {
    description: 'How modern entrepreneurs build seven-figure businesses using digital tools, remote teams, and lean startup principles.',
    tags: ['millionaire', 'digital business', 'entrepreneur'], rating: 4.4, reviews: 43,
  }),
  book('1HpV6cwyEKxbDSA2PuB-P9_hMh4Ju0DjZ', 'Millionaire Money Mindset Mastery', CAT_BF, 99, {
    description: 'Rewire your relationship with money. Adopt the psychological patterns and daily habits of financially successful people.',
    tags: ['mindset', 'money', 'psychology'], onSale: true, originalPrice: 149, rating: 4.3, reviews: 67,
  }),
  book('155fBEFgrjUrHTiy1qi7sXqHuYHewTh_m', 'The Rich Game', CAT_BF, 149, {
    description: 'Understand the rules of wealth creation that the affluent follow — from asset building to passive income systems.',
    tags: ['wealth', 'investing', 'passive income'], rating: 4.5, reviews: 29,
  }),
  book('1N3N8FpbPqw4T6VZflvj4sZlI1awTr80d', 'The Power of Broke', CAT_BF, 169, {
    description: 'How empty pockets, a tight budget, and a hunger for success can become your greatest competitive advantage in business.',
    tags: ['bootstrap', 'startup', 'hustle'], rating: 4.7, reviews: 52,
  }),
  book('1s-AjhlDGdjiKLUu15AijGmcrLTv1zUs9', '75 No-Code Business Ideas', CAT_BF, 189, {
    description: 'Launch a profitable online business without writing a single line of code. 75 proven models with step-by-step action plans.',
    tags: ['no-code', 'business ideas', 'startup'], featured: true, rating: 4.6, reviews: 88,
  }),
  book('1rSShPmBR0TWSVjpUch1xFpQqBijFP0Q7', 'The Gig Economy Mindset', CAT_BF, 119, {
    description: 'Navigate the gig economy with confidence. From freelancing strategies to building multiple income streams.',
    tags: ['freelance', 'gig economy', 'income'], rating: 4.3, reviews: 31,
  }),
  book('1rsvQHLFz9IZ2R8FI09kw6xYZ9Mc7noi4', 'Virtual Assistant Gig Goldmine', CAT_BF, 129, {
    description: 'Turn virtual assistant work into a thriving business. Scripts, pricing models, and client acquisition strategies included.',
    tags: ['virtual assistant', 'freelance'], rating: 4.2, reviews: 24,
  }),
  book('1igqaIAHL3dpiemAYL32aDN8kU2p5R3KC', 'Better Business Planning', CAT_BF, 89, {
    description: 'A practical framework for creating business plans that attract investors, guide execution, and adapt to market changes.',
    tags: ['business plan', 'strategy'], onSale: true, originalPrice: 119, rating: 4.1, reviews: 19,
  }),
  book('1kRBddFAWfqOubNAaG8hKBUuhDVlloJPN', 'Develop Your Financial IQ', CAT_BF, 109, {
    description: 'Build the financial literacy you need to make smarter investments, manage cash flow, and grow your net worth.',
    tags: ['financial literacy', 'investing'], rating: 4.4, reviews: 37,
  }),
  book('1kc2WT3mseyo17n5s6ztZnSk3cB5ySUCk', 'Brick and Mortar Business for Newbies', CAT_BF, 139, {
    description: 'Everything you need to start and run a successful physical business — location, staffing, and cash management.',
    tags: ['small business', 'retail', 'startup'], rating: 4.2, reviews: 16,
  }),
  book('1kz0LYo6enJfr0cFSi8OuOZ81w4QhYJPF', 'Legitimate Online Jobs and Income Sources', CAT_BF, 99, {
    description: 'Cut through the noise and find genuine online income opportunities that can replace or supplement your income.',
    tags: ['online jobs', 'remote work', 'income'], rating: 4.0, reviews: 28,
  }),
  book('1n1UOEmYCOUSABbaDCrgTplebsxrJz0P5', 'The Golden Rules of Acquiring Wealth', CAT_BF, 149, {
    description: 'Time-tested principles for building lasting wealth through disciplined saving, smart investing, and compound growth.',
    tags: ['wealth building', 'investing'], rating: 4.5, reviews: 41,
  }),
  book('1pVHSRpeSp8kTsJGs4hMPGYD8MjF0Auic', 'Real Estate Investment Secrets', CAT_BF, 199, {
    description: 'Inside strategies from successful property investors: find deals, secure financing, and maximise rental yields.',
    tags: ['real estate', 'property', 'investment'], onSale: true, originalPrice: 249, featured: true, rating: 4.8, reviews: 73,
  }),
  book('1YNE8qV0CdwLT3lUIAOe33eK6Q-SnUntT', 'Real Estate Essentials', CAT_BF, 179, {
    description: 'A comprehensive guide to real estate basics: buying, selling, renting, and managing properties for profit.',
    tags: ['real estate', 'property', 'guide'], rating: 4.6, reviews: 45,
  }),
  book('1l0jV2OObNV96h355uK-xMByySsabT22o', 'Making Money Online Complete Guide', CAT_BF, 119, {
    description: 'Proven methods for generating real online income from e-commerce, content creation, and digital products.',
    tags: ['online business', 'income', 'digital'], rating: 4.3, reviews: 55,
  }),

  // ── MARKETING & SALES ──
  book('1ntrE7j83Iqila-9cZEpsDUTyGrF4qqmp', 'Million Dollar Email Templates', CAT_MK, 179, {
    description: 'The exact email scripts that generate millions in revenue. Cold outreach, nurture sequences, and closing emails for every scenario.',
    tags: ['email marketing', 'copywriting', 'sales'], featured: true, rating: 4.9, reviews: 112,
  }),
  book('1rcAqNMmM-ghiijT-RfjUBSrgaheXemmm', 'Essential Marketing Start Guide', CAT_MK, 159, {
    description: 'Build a complete marketing engine from scratch. Covers branding, content strategy, SEO, paid ads, and conversion optimisation.',
    tags: ['marketing', 'strategy', 'guide'], rating: 4.6, reviews: 67,
  }),
  book('1rQVLHfGRvlHq-1gM7is6qdv1CzyhVian', 'TikTok Marketing Mastery Guide', CAT_MK, 139, {
    description: 'Crack the TikTok algorithm and grow a massive engaged audience. Content formulas, hashtag strategy, and monetisation methods.',
    tags: ['tiktok', 'social media', 'viral'], rating: 4.5, reviews: 89,
  }),
  book('1rfx_CZsrc-w6_3x_QdXROFXIEvKhAfV1', 'Stolen Tips from Top YouTubers', CAT_MK, 149, {
    description: 'The best-kept growth strategies from the biggest YouTube creators — content structure, thumbnails, retention hooks, and monetisation.',
    tags: ['youtube', 'video marketing', 'growth'], rating: 4.4, reviews: 44,
  }),
  book('1rssXVdGIK59D7j-PP5KEQBCKuckFksh5', 'Dr Growth Expanded Edition', CAT_MK, 199, {
    description: 'The definitive business growth playbook combining digital marketing, product-market fit, and scaling frameworks.',
    tags: ['growth', 'marketing', 'business'], featured: true, rating: 4.7, reviews: 38,
  }),
  book('1gciDNwimlewT7mSc8xEMy81JdD6nSDFH', 'SEO Basics: Rank on Google', CAT_MK, 99, {
    description: 'Master search engine optimisation fundamentals. Keyword research, on-page SEO, link building, and technical SEO explained simply.',
    tags: ['SEO', 'google', 'ranking'], rating: 4.3, reviews: 76,
  }),
  book('1hQ2NNkDemFfVZYMkrjq7xGTr78anrPpN', 'SEO Made Easy', CAT_MK, 89, {
    description: 'A step-by-step guide to SEO that drives real organic traffic without expensive agencies or complex tools.',
    tags: ['SEO', 'beginner', 'organic traffic'], onSale: true, originalPrice: 129, rating: 4.2, reviews: 53,
  }),
  book('1grrGiAVXEYVk58U1YU2PNwrmCGJTTP-F', 'Internet Marketing A to Z', CAT_MK, 139, {
    description: 'The complete dictionary of internet marketing — every channel, tactic, and metric explained with real examples.',
    tags: ['internet marketing', 'digital', 'reference'], rating: 4.4, reviews: 31,
  }),
  book('1goMbSt1mV1Xjo5bQFqniisUIOLxRivE6', 'Internet Marketing Survival Guide', CAT_MK, 119, {
    description: 'Navigate the ever-changing digital marketing landscape with strategies that stand the test of algorithm updates.',
    tags: ['internet marketing', 'strategy'], rating: 4.1, reviews: 22,
  }),
  book('1hRmJYD3PZqj9AZ1ojpfNvgRKzK9bPqIA', 'Facebook Strategies and Profits', CAT_MK, 109, {
    description: 'Organic and paid strategies to grow your business on Facebook. Page management, group marketing, and ads that convert.',
    tags: ['facebook', 'social media', 'ads'], rating: 4.2, reviews: 41,
  }),
  book('1gnV78Fi5JduSh1UTniJuM0fE_llv096g', 'Facebook Ads Mastered', CAT_MK, 139, {
    description: 'Advanced Facebook advertising techniques for high-converting campaigns, A/B testing, and profitable ad spend scaling.',
    tags: ['facebook ads', 'paid advertising', 'ROI'], rating: 4.6, reviews: 58,
  }),
  book('1i38Aya5hBXCIUZGHZovpoCCNwiPqBFtX', 'Copywriting Strategies Explained', CAT_MK, 109, {
    description: 'Write words that sell. From headlines to CTAs, learn the copywriting formulas professionals use to drive revenue.',
    tags: ['copywriting', 'persuasion', 'conversion'], rating: 4.5, reviews: 49,
  }),
  book('1g5oYfAcQr_WFK0TeREZuZB5VF-yHL2dx', 'List Building Secrets', CAT_MK, 99, {
    description: 'Build a massive, responsive email list that becomes your most valuable business asset using proven opt-in strategies.',
    tags: ['email list', 'list building', 'subscribers'], rating: 4.3, reviews: 35,
  }),
  book('1KY0mb9ovZgJ5lZ8VV1_5PBO4FdbagXtc', 'Sales Funnel Strategies', CAT_MK, 129, {
    description: 'Design high-converting sales funnels for any product or service. Lead magnets, tripwires, upsells, and retention sequences.',
    tags: ['sales funnel', 'conversion', 'marketing'], rating: 4.5, reviews: 44,
  }),
  book('1if8vF2GJcB4draH5S_QQL8WIa54RWRxd', 'Exploding Your Sales', CAT_MK, 109, {
    description: 'Aggressive but ethical sales tactics that dramatically increase your revenue. Overcome objections and close more deals.',
    tags: ['sales', 'closing', 'revenue'], rating: 4.4, reviews: 33,
  }),
  book('1iN7t2DHLIHamNcaNblJOZ4ter_sdsncQ', 'Easy Affiliate Marketing', CAT_MK, 89, {
    description: 'Start earning commission income from day one. Guide to picking profitable niches and driving affiliate traffic.',
    tags: ['affiliate marketing', 'passive income', 'commission'], rating: 4.1, reviews: 27,
  }),
  book('1MJjD_gWbxkJAVPMyeAUGBl6EHkEZArqc', 'Smart Phone Advertising', CAT_MK, 149, {
    description: 'Leverage the power of mobile advertising to reach customers where they spend most of their time — on their phones.',
    tags: ['mobile marketing', 'advertising', 'smartphone'], rating: 4.4, reviews: 36,
  }),
  book('1jsmIr9euLYqesqnFzeIqKw_Zg-1b05d4', 'How to Conduct a Successful Webinar', CAT_MK, 109, {
    description: 'Run webinars that engage, convert, and build your authority. Technical setup, content structure, and follow-up sequences.',
    tags: ['webinar', 'online events', 'conversion'], rating: 4.3, reviews: 29,
  }),
  book('1itWwSWQCaJdtddSaF-xelVLYcotbKDAJ', 'Offline Marketing Madness', CAT_MK, 99, {
    description: 'Combine traditional offline marketing with digital channels for a complete multi-channel revenue machine.',
    tags: ['offline marketing', 'local business', 'marketing'], rating: 4.0, reviews: 18,
  }),
  book('1hDCVCTFJU7s3hOW-tBIfOWRELNOwHqZz', 'Leveraging eBooks in the Digital Era', CAT_MK, 99, {
    description: 'Use ebooks as powerful marketing tools to generate leads, build authority, and create new revenue streams.',
    tags: ['ebooks', 'lead generation', 'content marketing'], rating: 4.2, reviews: 23,
  }),

  // ── ENTREPRENEURSHIP ──
  book('1PqCX-miqAwV3FQywfAmbRZM2_dpVuNf-', 'Think and Grow Rich', CAT_EN, 149, {
    description: 'Napoleon Hill\'s timeless masterpiece on the principles of success and wealth. Essential reading for every serious entrepreneur.',
    tags: ['mindset', 'success', 'wealth', 'classic'], featured: true, rating: 4.9, reviews: 204,
  }),
  book('1tN9UwBZHCjlXf--BPJMWGj6Yc3PYvg8Q', 'Habits of Successful Entrepreneurs', CAT_EN, 169, {
    description: 'Reverse-engineer the daily routines and mindset patterns of the world\'s most successful business leaders.',
    tags: ['habits', 'success', 'routine'], featured: true, rating: 4.7, reviews: 91,
  }),
  book('1WLIirXwpWGZD205wqttRslNeYJZAasBK', 'The Successful Entrepreneur', CAT_EN, 159, {
    description: 'A practical blueprint for building a successful business from idea to launch to scale, avoiding common pitfalls.',
    tags: ['entrepreneurship', 'startup', 'business'], rating: 4.5, reviews: 56,
  }),
  book('1bO3JvyYcyjxTZBeygp2dGvOKNNfKsB-d', 'The Secrets to a Millionaire Mind', CAT_EN, 179, {
    description: 'Proven system for reprogramming your financial blueprint. Understand the root causes of success and financial failure.',
    tags: ['mindset', 'millionaire', 'psychology'], rating: 4.8, reviews: 127,
  }),
  book('1HRzbuAfPmhnWoU_nIAN_6TOhxFwE8Qpn', 'Thinking Big and Getting Rich', CAT_EN, 149, {
    description: 'Develop a millionaire mindset that naturally attracts wealth and creates opportunities others cannot see.',
    tags: ['mindset', 'thinking big', 'wealth'], rating: 4.6, reviews: 74,
  }),
  book('1JKjcvgA7LIDRfDy_aB9Gd3ISL-9WFwTK', 'The Money Mindset', CAT_EN, 129, {
    description: 'Identify and eliminate the limiting beliefs blocking your financial success. A guide to mental wealth transformation.',
    tags: ['money mindset', 'beliefs', 'wealth'], rating: 4.5, reviews: 63,
  }),
  book('1kLDUtvUDv-6X_NMuA752j96Ca8FV_-Sq', 'Becoming a Great Leader in Business', CAT_EN, 119, {
    description: 'Develop the leadership qualities that inspire teams, build culture, and drive organisational performance.',
    tags: ['leadership', 'management', 'team'], rating: 4.4, reviews: 38,
  }),
  book('1JV9T_fPzhzc6qVRWjPgf3kSSdz2YqgvI', 'Awesome Character Building', CAT_EN, 99, {
    description: 'The character traits that define great entrepreneurs — integrity, resilience, adaptability — and how to cultivate them.',
    tags: ['character', 'personal development', 'entrepreneur'], rating: 4.2, reviews: 22,
  }),
  book('1Uj7Hm9RH1jtZbmLz6MVG7y2h3Mx9bdI6', 'Building the Business Brain', CAT_EN, 129, {
    description: 'Develop the analytical and creative thinking patterns successful business owners use to make better decisions.',
    tags: ['business thinking', 'strategy', 'decision making'], rating: 4.3, reviews: 31,
  }),
  book('11eoVLmxGwcfuDlhJYJiC7sytVUSpBGl-', 'Secret Sauce Strategies', CAT_EN, 149, {
    description: 'Proprietary frameworks successful entrepreneurs rarely share — growth hacking, retention, and scaling secrets.',
    tags: ['growth', 'strategy', 'scaling'], rating: 4.6, reviews: 47,
  }),
  book('1jDaIC0-TyBsbUU1zElH1RbVx3pvYDmjb', 'The Goal Setting Success Guide', CAT_EN, 99, {
    description: 'A science-backed system for setting goals that actually stick. From vision boards to OKRs and SMART targets.',
    tags: ['goals', 'productivity', 'success'], rating: 4.4, reviews: 59,
  }),
  book('11x6sXTKLg6WDCWBJhVK_Ce7K59vrBsOq', 'Scoring Your Goal', CAT_EN, 109, {
    description: 'Turn your entrepreneurial goals into reality with strategic planning, accountability systems, and execution frameworks.',
    tags: ['goals', 'planning', 'execution'], rating: 4.3, reviews: 28,
  }),
  book('10MmG4ug1UyN-oVYE5vONe4dFwUIpK1K9', 'Take Charge: Lead Your Own Life', CAT_EN, 109, {
    description: 'Stop waiting for permission. Learn how to take control of your career, finances, and life direction.',
    tags: ['leadership', 'self-empowerment'], rating: 4.3, reviews: 41,
  }),
  book('1gx-jryzBwj9X19d3TP0uGSYtsxMKn0FN', 'Procrastination Killer', CAT_EN, 89, {
    description: 'Destroy procrastination permanently with neuroscience-backed techniques. Get more done in less time with less stress.',
    tags: ['productivity', 'procrastination', 'time management'], rating: 4.5, reviews: 82,
  }),
  book('1qJcJ-RqpIXIHlyP5KfjMiifhTT9yBxYS', 'Driving Your Passions', CAT_EN, 119, {
    description: 'Transform your passion into a profitable business. Find your niche, validate your idea, and launch with purpose.',
    tags: ['passion', 'purpose', 'business'], rating: 4.4, reviews: 36,
  }),

  // ── ACQUISITIONS & SaaS ──
  book('1rnTvxbUvEzeX6-98qpMi4IeeNcc-B-IL', 'The Acquisition Playbook', CAT_AQ, 229, {
    description: 'A complete system for acquiring online businesses — from deal sourcing and valuation to due diligence and integration.',
    tags: ['acquisitions', 'buyouts', 'online business'], featured: true, rating: 4.8, reviews: 64,
  }),
  book('1rQNZb6XKjWWkDU5bEZY4GSkZGRaZ9Cuu', 'Breakout Blueprint', CAT_AQ, 179, {
    description: 'Break free from the rat race by buying an existing business. Blueprint from search fund to successful ownership.',
    tags: ['business buying', 'freedom', 'acquisition'], rating: 4.6, reviews: 39,
  }),
  book('1qnSgwHt4UQEOKvNiJbEouQT6S0ByiN2b', 'How to Structure an Acquisition Deal', CAT_AQ, 169, {
    description: 'Negotiate deals that work for both buyer and seller. Term sheets, earnouts, and financing structures explained.',
    tags: ['deal structure', 'negotiation', 'acquisition'], rating: 4.7, reviews: 28,
  }),
  book('1r2d5Uw3Yz1tIl5ra9cIOns58IZJsKwCK', 'How to Value Your SaaS Startup', CAT_AQ, 179, {
    description: 'Determine the true market value of your software business using proven SaaS valuation multiples and growth metrics.',
    tags: ['valuation', 'SaaS', 'startup'], rating: 4.7, reviews: 32,
  }),
  book('1r4r7l_YSAqAwzd1GtTtFD89cNuD2qBVs', 'How to Know if a SaaS Business Is Worth Acquiring', CAT_AQ, 149, {
    description: 'The due diligence checklist every SaaS buyer needs. Churn analysis, revenue quality, tech debt, and growth assessment.',
    tags: ['due diligence', 'SaaS', 'buying'], rating: 4.6, reviews: 25,
  }),
  book('1r4vHIlrLirWF5wiaAw7fjyejnPdKTMAO', 'Negotiating a Letter of Intent', CAT_AQ, 149, {
    description: 'Navigate the LOI negotiation process with confidence. Protect your interests while building rapport with sellers.',
    tags: ['LOI', 'negotiation', 'legal'], rating: 4.5, reviews: 19,
  }),
  book('1qw5d9gxV4dhg-PyIuPVqZbDAv7gR6afE', 'Due Diligence and How to Survive It', CAT_AQ, 129, {
    description: 'Everything that can go wrong in due diligence — and how to avoid it. A practical guide for buyers and sellers.',
    tags: ['due diligence', 'risk', 'checklist'], rating: 4.4, reviews: 23,
  }),
  book('1qhPkPN1a3kT8Ls8n1VvlY4uy9-cGnMr6', '10 Ways to Attract More Offers for Your Startup', CAT_AQ, 149, {
    description: 'Maximise your startup\'s attractiveness to acquirers. Growth signals, clean financials, and strategic positioning.',
    tags: ['exit', 'startup sale', 'M&A'], rating: 4.5, reviews: 17,
  }),
  book('1sBwDjuQLf5OuY1C6g8iX0RzgHdid8OO8', 'Infinite Income', CAT_AQ, 199, {
    description: 'System for building infinite recurring revenue through digital products, coaching, and automated sales funnels.',
    tags: ['recurring revenue', 'digital products', 'automation'], rating: 4.6, reviews: 51,
  }),

  // ── PERSONAL DEVELOPMENT ──
  book('1j9FBBSRI9B7xZDQyD5jKfaHA49doXCuM', 'Think Big and Grow Rich in the Digital Age', CAT_PD, 129, {
    description: 'Napoleon Hill\'s principles updated for the digital era — apply timeless wealth wisdom to the internet economy.',
    tags: ['think big', 'digital', 'wealth'], rating: 4.6, reviews: 47,
  }),
  book('1gPCB02-s5zWjw7SMT_Nky9QYv7nh-dF2', 'Positive Thinking: The Key to Success', CAT_PD, 89, {
    description: 'Harness the power of positive thinking to overcome challenges, attract opportunities, and create the life you deserve.',
    tags: ['positive thinking', 'mindset', 'success'], rating: 4.3, reviews: 61,
  }),
  book('1nIXOMOMcFF4KwxrrJu4QgJ8BGDbUuLBp', '404 Self-Improvement Strategies', CAT_PD, 99, {
    description: '404 practical, actionable strategies for improving every area of your life — health, relationships, career, and finances.',
    tags: ['self-improvement', 'strategies', 'lifestyle'], rating: 4.4, reviews: 73,
  }),
  book('1L3bhT5skm7c29HJhIz7TxVvoEHv_94gz', 'Practical Personal Development', CAT_PD, 119, {
    description: 'No-fluff guide to real personal growth. Frameworks for building better habits, stronger relationships, and clearer purpose.',
    tags: ['personal development', 'habits', 'growth'], rating: 4.5, reviews: 55,
  }),
  book('1IDs5yzmu00bOiMpI-5BYvTtQaDOK8-mQ', 'Aiming Higher: Advanced Success Strategies', CAT_PD, 99, {
    description: 'Push past your current ceiling with advanced goal-setting, visualisation, and accountability systems used by high performers.',
    tags: ['performance', 'success', 'goals'], rating: 4.3, reviews: 29,
  }),
]

// For books page seed categories that don't exist in DB yet
export function filterSeedBooks(params: {
  q?: string
  category?: string
  featured?: string
  on_sale?: string
  min_price?: string
  max_price?: string
  sort?: string
  page?: number
  pageSize?: number
}) {
  const PAGE_SIZE = params.pageSize ?? 20
  let books = [...SEED_BOOKS]

  if (params.q) {
    const q = params.q.toLowerCase()
    books = books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q))
    )
  }
  if (params.category) {
    books = books.filter(b => b.categories?.slug === params.category)
  }
  if (params.featured === 'true') {
    books = books.filter(b => b.featured)
  }
  if (params.on_sale === 'true') {
    books = books.filter(b => b.on_sale)
  }
  if (params.min_price) {
    books = books.filter(b => b.price >= Number(params.min_price))
  }
  if (params.max_price) {
    books = books.filter(b => b.price <= Number(params.max_price))
  }

  switch (params.sort) {
    case 'price_asc':  books.sort((a, b) => a.price - b.price); break
    case 'price_desc': books.sort((a, b) => b.price - a.price); break
    case 'popular':    books.sort((a, b) => b.review_count - a.review_count); break
    case 'rating':     books.sort((a, b) => b.rating - a.rating); break
    default: break // keep insertion order (newest)
  }

  const total = books.length
  const page = Math.max(1, params.page ?? 1)
  const paged = books.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return { books: paged, total, page }
}
