/**
 * Seed the Readify catalog from Google Drive folders.
 *
 * Usage:
 *   npx tsx supabase/seed-drive-catalog.ts
 *
 * Prerequisites:
 *   - Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - Run schema.sql in Supabase first
 *   - Create a publisher account and set PUBLISHER_ID below
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const PUBLISHER_ID = process.env.SEED_PUBLISHER_ID! // UUID of the publisher account

// Google Drive folder IDs
const DRIVE_FOLDERS = {
  agriculture_science: '135Ves3lqnArNMzX9Iz0gNloqfLBnasJ9',
  business_finance: '1Gk2p0mLKEGOc9z8jFzPt-_rmfkwm4Z_q',
  entrepreneurship: '1VOpAQf97Qc4lLDmDpGs2CM-J5jX0Uz6J',
}

// Category mapping
const CATEGORY_MAP: Record<string, string> = {
  agriculture_science: 'agriculture-science',
  business_finance: 'business-finance',
  entrepreneurship: 'business-finance',
}

// Ebook catalog from the three Google Drive folders
// Drive file IDs sourced from MCP Drive API query results
const DRIVE_CATALOG: Array<{
  driveFileId: string
  title: string
  author?: string
  folderKey: string
  price: number
  originalPrice?: number
  onSale?: boolean
  featured?: boolean
  description?: string
  tags?: string[]
}> = [
  // ── Agriculture & Science folder ──
  {
    driveFileId: '1nODgTnqPkQ4D4fws7ByzZ71kAyfl7bZ6',
    title: 'Novel Postharvest Treatments of Fresh Produce',
    folderKey: 'agriculture_science',
    price: 299,
    tags: ['agriculture', 'postharvest', 'food science'],
    description: 'Comprehensive guide to modern postharvest technologies for maintaining freshness and extending shelf life of fruits and vegetables.',
  },

  // ── Business & Finance folder ──
  {
    driveFileId: '1tDquYwTIcmPosFMpr8nNLponjZ8dx-uE',
    title: 'How to DeFi: Advanced Strategies',
    folderKey: 'business_finance',
    price: 199,
    tags: ['defi', 'crypto', 'advanced'],
    description: 'Advanced DeFi trading strategies, liquidity provision, and protocol analysis.',
  },
  {
    driveFileId: '1oOmoLwRQmj5BP9OkT9MA3IO--T6SZDy8',
    title: 'Cold Hard Truth On Business, Money and Life',
    folderKey: 'business_finance',
    price: 169,
    featured: true,
    tags: ['business', 'money', 'lifestyle'],
    description: 'A no-nonsense guide to mastering money and building successful businesses.',
  },
  {
    driveFileId: '15OVo1bBL8laDw-bADDxxf7n3ytrf_Ake',
    title: 'Modern Millionaires',
    folderKey: 'business_finance',
    price: 129,
    tags: ['millionaire', 'digital business', 'entrepreneur'],
    description: 'How modern entrepreneurs build seven-figure businesses using digital tools and lean startup principles.',
  },
  {
    driveFileId: '1HpV6cwyEKxbDSA2PuB-P9_hMh4Ju0DjZ',
    title: 'Millionaire Money Mindset Mastery',
    folderKey: 'business_finance',
    price: 99,
    originalPrice: 149,
    onSale: true,
    tags: ['mindset', 'money', 'psychology'],
    description: 'Rewire your relationship with money. Adopt the psychological patterns of financially successful people.',
  },
  {
    driveFileId: '155fBEFgrjUrHTiy1qi7sXqHuYHewTh_m',
    title: 'The Rich Game',
    folderKey: 'business_finance',
    price: 149,
    tags: ['wealth', 'investing', 'passive income'],
    description: 'Understand the rules of wealth creation that the affluent follow.',
  },
  {
    driveFileId: '1N3N8FpbPqw4T6VZflvj4sZlI1awTr80d',
    title: 'The Power of Broke',
    folderKey: 'business_finance',
    price: 169,
    tags: ['bootstrap', 'startup', 'hustle'],
    description: 'How empty pockets and a hunger for success can become your greatest competitive advantage.',
  },
  {
    driveFileId: '1s-AjhlDGdjiKLUu15AijGmcrLTv1zUs9',
    title: '75 No-Code Business Ideas',
    folderKey: 'business_finance',
    price: 189,
    featured: true,
    tags: ['no-code', 'business ideas', 'startup'],
    description: 'Launch a profitable online business without writing a single line of code.',
  },
  {
    driveFileId: '1ntrE7j83Iqila-9cZEpsDUTyGrF4qqmp',
    title: 'Million Dollar Email Templates',
    folderKey: 'business_finance',
    price: 179,
    featured: true,
    tags: ['email marketing', 'copywriting', 'sales'],
    description: 'The exact email scripts that generate millions in revenue.',
  },
  {
    driveFileId: '1rcAqNMmM-ghiijT-RfjUBSrgaheXemmm',
    title: 'Essential Marketing Start Guide',
    folderKey: 'business_finance',
    price: 159,
    tags: ['marketing', 'strategy', 'guide'],
    description: 'Build a complete marketing engine from scratch — branding, content, SEO, paid ads, and conversion.',
  },
  {
    driveFileId: '1rnTvxbUvEzeX6-98qpMi4IeeNcc-B-IL',
    title: 'The Acquisition Playbook',
    folderKey: 'business_finance',
    price: 229,
    featured: true,
    tags: ['acquisitions', 'buyouts', 'online business'],
    description: 'A complete system for acquiring online businesses — from sourcing to due diligence to integration.',
  },
  {
    driveFileId: '1rsvQHLFz9IZ2R8FI09kw6xYZ9Mc7noi4',
    title: 'Virtual Assistant Gig Goldmine',
    folderKey: 'business_finance',
    price: 129,
    tags: ['virtual assistant', 'freelance', 'gig economy'],
    description: 'Turn VA work into a thriving business with scripts, pricing models, and client acquisition strategies.',
  },
  {
    driveFileId: '1igqaIAHL3dpiemAYL32aDN8kU2p5R3KC',
    title: 'Better Business Planning',
    folderKey: 'business_finance',
    price: 89,
    originalPrice: 119,
    onSale: true,
    tags: ['business plan', 'strategy'],
    description: 'A practical framework for creating business plans that attract investors and guide execution.',
  },
  {
    driveFileId: '1kRBddFAWfqOubNAaG8hKBUuhDVlloJPN',
    title: 'Develop Your Financial IQ',
    folderKey: 'business_finance',
    price: 109,
    tags: ['financial literacy', 'investing'],
    description: 'Build the financial literacy you need to make smarter investments and grow your net worth.',
  },
  {
    driveFileId: '1rSShPmBR0TWSVjpUch1xFpQqBijFP0Q7',
    title: 'The Gig Economy Mindset',
    folderKey: 'business_finance',
    price: 119,
    tags: ['freelance', 'gig economy', 'income'],
    description: 'Navigate the gig economy with confidence and build multiple income streams.',
  },
  {
    driveFileId: '1kc2WT3mseyo17n5s6ztZnSk3cB5ySUCk',
    title: 'Brick and Mortar Business for Newbies',
    folderKey: 'business_finance',
    price: 139,
    tags: ['small business', 'retail', 'startup'],
    description: 'Everything you need to start and run a successful physical business.',
  },
  {
    driveFileId: '1kz0LYo6enJfr0cFSi8OuOZ81w4QhYJPF',
    title: 'Legitimate Online Jobs and Income Sources',
    folderKey: 'business_finance',
    price: 99,
    tags: ['online jobs', 'remote work', 'income'],
    description: 'Find genuine online income opportunities that can replace or supplement your income.',
  },
  {
    driveFileId: '1rQNZb6XKjWWkDU5bEZY4GSkZGRaZ9Cuu',
    title: 'Breakout Blueprint',
    folderKey: 'business_finance',
    price: 179,
    tags: ['business buying', 'acquisition', 'freedom'],
    description: 'Break free from the rat race by buying an existing business.',
  },
  {
    driveFileId: '1qnSgwHt4UQEOKvNiJbEouQT6S0ByiN2b',
    title: 'How to Structure an Acquisition Deal',
    folderKey: 'business_finance',
    price: 169,
    tags: ['deal structure', 'negotiation', 'acquisition'],
    description: 'Negotiate deals that work for both buyer and seller. Term sheets, earnouts, and financing structures.',
  },
  {
    driveFileId: '1r2d5Uw3Yz1tIl5ra9cIOns58IZJsKwCK',
    title: 'How to Value Your SaaS Startup',
    folderKey: 'business_finance',
    price: 179,
    tags: ['valuation', 'SaaS', 'startup'],
    description: 'Determine the true market value of your software business using proven SaaS valuation multiples.',
  },
  {
    driveFileId: '1r4r7l_YSAqAwzd1GtTtFD89cNuD2qBVs',
    title: 'How to Know if a SaaS Business Is Worth Acquiring',
    folderKey: 'business_finance',
    price: 149,
    tags: ['due diligence', 'SaaS', 'buying'],
    description: 'The due diligence checklist every SaaS buyer needs.',
  },
  {
    driveFileId: '1r4vHIlrLirWF5wiaAw7fjyejnPdKTMAO',
    title: 'Negotiating a Letter of Intent',
    folderKey: 'business_finance',
    price: 149,
    tags: ['LOI', 'negotiation', 'legal'],
    description: 'Navigate the LOI negotiation process with confidence.',
  },
  {
    driveFileId: '1qw5d9gxV4dhg-PyIuPVqZbDAv7gR6afE',
    title: 'Due Diligence and How to Survive It',
    folderKey: 'business_finance',
    price: 129,
    tags: ['due diligence', 'risk', 'checklist'],
    description: 'Everything that can go wrong in due diligence — and how to avoid it.',
  },
  {
    driveFileId: '1qhPkPN1a3kT8Ls8n1VvlY4uy9-cGnMr6',
    title: '10 Ways to Attract More Offers for Your Startup',
    folderKey: 'business_finance',
    price: 149,
    tags: ['exit', 'startup sale', 'M&A'],
    description: 'Maximise your startup\'s attractiveness to acquirers.',
  },
  {
    driveFileId: '1sBwDjuQLf5OuY1C6g8iX0RzgHdid8OO8',
    title: 'Infinite Income',
    folderKey: 'business_finance',
    price: 199,
    tags: ['recurring revenue', 'digital products', 'automation'],
    description: 'System for building infinite recurring revenue through digital products and automated funnels.',
  },
  {
    driveFileId: '1rQVLHfGRvlHq-1gM7is6qdv1CzyhVian',
    title: 'TikTok Marketing Mastery Guide',
    folderKey: 'business_finance',
    price: 139,
    tags: ['tiktok', 'social media', 'viral'],
    description: 'Crack the TikTok algorithm and grow a massive engaged audience.',
  },
  {
    driveFileId: '1rfx_CZsrc-w6_3x_QdXROFXIEvKhAfV1',
    title: 'Stolen Tips from Top YouTubers',
    folderKey: 'business_finance',
    price: 149,
    tags: ['youtube', 'video marketing', 'growth'],
    description: 'Growth strategies from the biggest YouTube creators — content, thumbnails, retention, and monetisation.',
  },
  {
    driveFileId: '1rssXVdGIK59D7j-PP5KEQBCKuckFksh5',
    title: 'Dr Growth Expanded Edition',
    folderKey: 'business_finance',
    price: 199,
    featured: true,
    tags: ['growth', 'marketing', 'business'],
    description: 'The definitive business growth playbook — marketing, product-market fit, and scaling frameworks.',
  },
  {
    driveFileId: '1gciDNwimlewT7mSc8xEMy81JdD6nSDFH',
    title: 'SEO Basics: Rank on Google',
    folderKey: 'business_finance',
    price: 99,
    tags: ['SEO', 'google', 'ranking'],
    description: 'Master SEO fundamentals. Keyword research, on-page optimisation, and link building explained simply.',
  },
  {
    driveFileId: '1hQ2NNkDemFfVZYMkrjq7xGTr78anrPpN',
    title: 'SEO Made Easy',
    folderKey: 'business_finance',
    price: 89,
    originalPrice: 129,
    onSale: true,
    tags: ['SEO', 'beginner', 'organic traffic'],
    description: 'A step-by-step guide to SEO that drives real organic traffic.',
  },
  {
    driveFileId: '1grrGiAVXEYVk58U1YU2PNwrmCGJTTP-F',
    title: 'Internet Marketing A to Z',
    folderKey: 'business_finance',
    price: 139,
    tags: ['internet marketing', 'digital', 'reference'],
    description: 'The complete dictionary of internet marketing — every channel, tactic, and metric explained.',
  },
  {
    driveFileId: '1hRmJYD3PZqj9AZ1ojpfNvgRKzK9bPqIA',
    title: 'Facebook Strategies and Profits',
    folderKey: 'business_finance',
    price: 109,
    tags: ['facebook', 'social media', 'ads'],
    description: 'Organic and paid strategies to grow your business on Facebook.',
  },
  {
    driveFileId: '1i38Aya5hBXCIUZGHZovpoCCNwiPqBFtX',
    title: 'Copywriting Strategies Explained',
    folderKey: 'business_finance',
    price: 109,
    tags: ['copywriting', 'persuasion', 'conversion'],
    description: 'Write words that sell. Copywriting formulas professionals use to drive revenue.',
  },
  {
    driveFileId: '1g5oYfAcQr_WFK0TeREZuZB5VF-yHL2dx',
    title: 'List Building Secrets',
    folderKey: 'business_finance',
    price: 99,
    tags: ['email list', 'list building', 'subscribers'],
    description: 'Build a massive, responsive email list using proven opt-in strategies.',
  },
  {
    driveFileId: '1KY0mb9ovZgJ5lZ8VV1_5PBO4FdbagXtc',
    title: 'Sales Funnel Strategies',
    folderKey: 'business_finance',
    price: 129,
    tags: ['sales funnel', 'conversion', 'marketing'],
    description: 'Design high-converting sales funnels for any product or service.',
  },
  {
    driveFileId: '1if8vF2GJcB4draH5S_QQL8WIa54RWRxd',
    title: 'Exploding Your Sales',
    folderKey: 'business_finance',
    price: 109,
    tags: ['sales', 'closing', 'revenue'],
    description: 'Ethical sales tactics that dramatically increase your revenue.',
  },
  {
    driveFileId: '1iN7t2DHLIHamNcaNblJOZ4ter_sdsncQ',
    title: 'Easy Affiliate Marketing',
    folderKey: 'business_finance',
    price: 89,
    tags: ['affiliate marketing', 'passive income', 'commission'],
    description: 'Start earning commission income from day one with affiliate marketing.',
  },
  {
    driveFileId: '1jsmIr9euLYqesqnFzeIqKw_Zg-1b05d4',
    title: 'How to Conduct a Successful Webinar',
    folderKey: 'business_finance',
    price: 109,
    tags: ['webinar', 'online events', 'conversion'],
    description: 'Run webinars that engage, convert, and build your authority.',
  },
  {
    driveFileId: '1itWwSWQCaJdtddSaF-xelVLYcotbKDAJ',
    title: 'Offline Marketing Madness',
    folderKey: 'business_finance',
    price: 99,
    tags: ['offline marketing', 'local business'],
    description: 'Combine traditional offline marketing with digital channels for a multi-channel revenue machine.',
  },
  {
    driveFileId: '1hDCVCTFJU7s3hOW-tBIfOWRELNOwHqZz',
    title: 'Leveraging eBooks in the Digital Era',
    folderKey: 'business_finance',
    price: 99,
    tags: ['ebooks', 'lead generation', 'content marketing'],
    description: 'Use ebooks as powerful marketing tools to generate leads and build authority.',
  },

  // ── Entrepreneurship folder ──
  {
    driveFileId: '1PqCX-miqAwV3FQywfAmbRZM2_dpVuNf-',
    title: 'Think and Grow Rich',
    folderKey: 'entrepreneurship',
    price: 149,
    featured: true,
    tags: ['mindset', 'success', 'wealth', 'classic'],
    description: 'Napoleon Hill\'s timeless masterpiece on the principles of success and wealth.',
  },
  {
    driveFileId: '1tN9UwBZHCjlXf--BPJMWGj6Yc3PYvg8Q',
    title: 'Habits of Successful Entrepreneurs',
    folderKey: 'entrepreneurship',
    price: 169,
    featured: true,
    tags: ['habits', 'success', 'routine'],
    description: 'Reverse-engineer the daily routines and mindset patterns of the world\'s most successful business leaders.',
  },
  {
    driveFileId: '1WLIirXwpWGZD205wqttRslNeYJZAasBK',
    title: 'The Successful Entrepreneur',
    folderKey: 'entrepreneurship',
    price: 159,
    tags: ['entrepreneurship', 'startup', 'business'],
    description: 'A practical blueprint for building a successful business from idea to launch to scale.',
  },
  {
    driveFileId: '1bO3JvyYcyjxTZBeygp2dGvOKNNfKsB-d',
    title: 'The Secrets to a Millionaire Mind',
    folderKey: 'entrepreneurship',
    price: 179,
    tags: ['mindset', 'millionaire', 'psychology'],
    description: 'Proven system for reprogramming your financial blueprint.',
  },
  {
    driveFileId: '1HRzbuAfPmhnWoU_nIAN_6TOhxFwE8Qpn',
    title: 'Thinking Big and Getting Rich',
    folderKey: 'entrepreneurship',
    price: 149,
    tags: ['mindset', 'thinking big', 'wealth'],
    description: 'Develop a millionaire mindset that naturally attracts wealth and creates opportunities.',
  },
  {
    driveFileId: '1JKjcvgA7LIDRfDy_aB9Gd3ISL-9WFwTK',
    title: 'The Money Mindset',
    folderKey: 'entrepreneurship',
    price: 129,
    tags: ['money mindset', 'beliefs', 'wealth'],
    description: 'Identify and eliminate the limiting beliefs blocking your financial success.',
  },
  {
    driveFileId: '1pVHSRpeSp8kTsJGs4hMPGYD8MjF0Auic',
    title: 'Real Estate Investment Secrets',
    folderKey: 'entrepreneurship',
    price: 199,
    originalPrice: 249,
    onSale: true,
    featured: true,
    tags: ['real estate', 'property', 'investment'],
    description: 'Inside strategies from successful property investors: find deals, secure financing, and maximise yields.',
  },
  {
    driveFileId: '1YNE8qV0CdwLT3lUIAOe33eK6Q-SnUntT',
    title: 'Real Estate Essentials',
    folderKey: 'entrepreneurship',
    price: 179,
    tags: ['real estate', 'property', 'guide'],
    description: 'A comprehensive guide to real estate basics: buying, selling, renting, and managing properties.',
  },
  {
    driveFileId: '1gnV78Fi5JduSh1UTniJuM0fE_llv096g',
    title: 'Facebook Ads Mastered',
    folderKey: 'entrepreneurship',
    price: 139,
    tags: ['facebook ads', 'paid advertising', 'ROI'],
    description: 'Advanced Facebook advertising techniques for high-converting campaigns.',
  },
  {
    driveFileId: '19WrYtCrhjHe8xfkTWTPbTI1BfQT9qYsW',
    title: 'Making Money Online',
    folderKey: 'entrepreneurship',
    price: 119,
    tags: ['online business', 'income', 'digital'],
    description: 'Proven methods for generating real online income.',
  },
  {
    driveFileId: '1kLDUtvUDv-6X_NMuA752j96Ca8FV_-Sq',
    title: 'Becoming a Great Leader in Business',
    folderKey: 'entrepreneurship',
    price: 119,
    tags: ['leadership', 'management', 'team'],
    description: 'Develop the leadership qualities that inspire teams and drive organisational performance.',
  },
  {
    driveFileId: '1JV9T_fPzhzc6qVRWjPgf3kSSdz2YqgvI',
    title: 'Awesome Character Building',
    folderKey: 'entrepreneurship',
    price: 99,
    tags: ['character', 'personal development'],
    description: 'The character traits that define great entrepreneurs and how to cultivate them.',
  },
  {
    driveFileId: '1Uj7Hm9RH1jtZbmLz6MVG7y2h3Mx9bdI6',
    title: 'Building the Business Brain',
    folderKey: 'entrepreneurship',
    price: 129,
    tags: ['business thinking', 'strategy', 'decision making'],
    description: 'Develop analytical and creative thinking patterns successful business owners use.',
  },
  {
    driveFileId: '11eoVLmxGwcfuDlhJYJiC7sytVUSpBGl-',
    title: 'Secret Sauce Strategies',
    folderKey: 'entrepreneurship',
    price: 149,
    tags: ['growth', 'strategy', 'scaling'],
    description: 'Proprietary frameworks successful entrepreneurs rarely share.',
  },
  {
    driveFileId: '1jDaIC0-TyBsbUU1zElH1RbVx3pvYDmjb',
    title: 'The Goal Setting Success Guide',
    folderKey: 'entrepreneurship',
    price: 99,
    tags: ['goals', 'productivity', 'success'],
    description: 'A science-backed system for setting and achieving goals that actually stick.',
  },
  {
    driveFileId: '11x6sXTKLg6WDCWBJhVK_Ce7K59vrBsOq',
    title: 'Scoring Your Goal',
    folderKey: 'entrepreneurship',
    price: 109,
    tags: ['goals', 'planning', 'execution'],
    description: 'Turn entrepreneurial goals into reality with strategic planning and execution frameworks.',
  },
  {
    driveFileId: '10MmG4ug1UyN-oVYE5vONe4dFwUIpK1K9',
    title: 'Take Charge: Lead Your Own Life',
    folderKey: 'entrepreneurship',
    price: 109,
    tags: ['leadership', 'self-empowerment'],
    description: 'Learn how to take control of your career, finances, and life direction.',
  },
  {
    driveFileId: '1gx-jryzBwj9X19d3TP0uGSYtsxMKn0FN',
    title: 'Procrastination Killer',
    folderKey: 'entrepreneurship',
    price: 89,
    tags: ['productivity', 'procrastination', 'time management'],
    description: 'Destroy procrastination permanently with neuroscience-backed techniques.',
  },
  {
    driveFileId: '1qJcJ-RqpIXIHlyP5KfjMiifhTT9yBxYS',
    title: 'Driving Your Passions',
    folderKey: 'entrepreneurship',
    price: 119,
    tags: ['passion', 'purpose', 'business'],
    description: 'Transform your passion into a profitable business.',
  },
  {
    driveFileId: '1j9FBBSRI9B7xZDQyD5jKfaHA49doXCuM',
    title: 'Think Big and Grow Rich in the Digital Age',
    folderKey: 'entrepreneurship',
    price: 129,
    tags: ['think big', 'digital', 'wealth'],
    description: 'Napoleon Hill\'s principles updated for the digital era.',
  },
  {
    driveFileId: '1gPCB02-s5zWjw7SMT_Nky9QYv7nh-dF2',
    title: 'Positive Thinking: The Key to Success',
    folderKey: 'entrepreneurship',
    price: 89,
    tags: ['positive thinking', 'mindset', 'success'],
    description: 'Harness the power of positive thinking to overcome challenges and attract opportunities.',
  },
  {
    driveFileId: '1nIXOMOMcFF4KwxrrJu4QgJ8BGDbUuLBp',
    title: '404 Self-Improvement Strategies',
    folderKey: 'entrepreneurship',
    price: 99,
    tags: ['self-improvement', 'strategies', 'lifestyle'],
    description: '404 practical strategies for improving every area of your life.',
  },
  {
    driveFileId: '1L3bhT5skm7c29HJhIz7TxVvoEHv_94gz',
    title: 'Practical Personal Development',
    folderKey: 'entrepreneurship',
    price: 119,
    tags: ['personal development', 'habits', 'growth'],
    description: 'No-fluff guide to real personal growth with proven frameworks.',
  },
  {
    driveFileId: '1IDs5yzmu00bOiMpI-5BYvTtQaDOK8-mQ',
    title: 'Aiming Higher: Advanced Success Strategies',
    folderKey: 'entrepreneurship',
    price: 99,
    tags: ['performance', 'success', 'goals'],
    description: 'Push past your ceiling with advanced goal-setting and accountability systems.',
  },
  {
    driveFileId: '1MJjD_gWbxkJAVPMyeAUGBl6EHkEZArqc',
    title: 'Smart Phone Advertising',
    folderKey: 'entrepreneurship',
    price: 149,
    tags: ['mobile marketing', 'advertising', 'smartphone'],
    description: 'Leverage mobile advertising to reach customers where they spend most of their time.',
  },
  {
    driveFileId: '1n1UOEmYCOUSABbaDCrgTplebsxrJz0P5',
    title: 'The Golden Rules of Acquiring Wealth',
    folderKey: 'entrepreneurship',
    price: 149,
    tags: ['wealth building', 'investing', 'rules'],
    description: 'Time-tested principles for building lasting wealth through disciplined saving and smart investing.',
  },
]

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

async function seed() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  console.log('🚀 Starting catalog seed from Google Drive...')

  // Get category IDs
  const { data: categories } = await supabase.from('categories').select('id, slug')
  const catMap: Record<string, string> = {}
  categories?.forEach((c: any) => { catMap[c.slug] = c.id })

  let seeded = 0
  let skipped = 0

  for (const book of DRIVE_CATALOG) {
    const categorySlug = CATEGORY_MAP[book.folderKey]
    const categoryId = catMap[categorySlug]
    const slug = slugify(book.title) + '-' + Math.random().toString(36).slice(2, 6)

    const { error } = await supabase.from('books').insert({
      publisher_id: PUBLISHER_ID,
      category_id: categoryId || null,
      title: book.title,
      slug,
      author: book.author || null,
      description: book.description || `A comprehensive ebook on ${book.title}.`,
      drive_file_id: book.driveFileId,
      price: book.price,
      original_price: book.originalPrice || null,
      on_sale: book.onSale || false,
      currency: 'ZAR',
      language: 'English',
      status: 'published',
      tags: book.tags || [],
    })

    if (error) {
      console.error(`✗ Failed to seed "${book.title}":`, error.message)
      skipped++
    } else {
      console.log(`✓ Seeded: ${book.title} @ R${book.price}`)
      seeded++
    }
  }

  console.log(`\n✅ Seed complete: ${seeded} books seeded, ${skipped} skipped`)
}

seed().catch(console.error)
