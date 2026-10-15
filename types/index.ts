export type UserRole = 'buyer' | 'publisher' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Publisher {
  id: string
  company_name: string
  vat_number: string | null
  cipc_registration: string | null
  physical_address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country: string
  phone: string | null
  website: string | null
  bio: string | null
  logo_url: string | null
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  rejection_reason: string | null
  commission_rate: number
  total_earnings: number
  total_books: number
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  parent_id: string | null
  sort_order: number
  created_at: string
}

export interface Book {
  id: string
  publisher_id: string
  category_id: string | null
  title: string
  slug: string
  subtitle: string | null
  description: string | null
  author: string | null
  isbn: string | null
  language: string
  pages: number | null
  publication_date: string | null
  cover_url: string | null
  file_url: string | null
  drive_file_id: string | null
  sample_url: string | null
  price: number
  original_price: number | null
  currency: string
  status: 'draft' | 'published' | 'unpublished' | 'rejected'
  featured: boolean
  on_sale: boolean
  sale_ends_at: string | null
  tags: string[]
  total_sales: number
  total_revenue: number
  rating: number
  review_count: number
  created_at: string
  updated_at: string
  publishers?: Publisher
  categories?: Category
}

export interface Promotion {
  id: string
  name: string
  code: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number | null
  max_uses: number | null
  used_count: number
  applicable_to: 'all' | 'specific_books' | 'specific_categories'
  book_ids: string[]
  category_ids: string[]
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  buyer_id: string | null
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  subtotal: number
  discount: number
  vat_amount: number
  vat_rate: number
  total: number
  currency: string
  payment_method: 'payfast' | 'stripe' | 'paypal' | 'coinbase' | 'free' | null
  payment_id: string | null
  promotion_id: string | null
  promotion_code: string | null
  buyer_name: string | null
  buyer_email: string
  created_at: string
  paid_at: string | null
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  book_id: string
  publisher_id: string
  title: string
  cover_url: string | null
  price: number
  created_at: string
  books?: Book
}

export interface Download {
  id: string
  order_item_id: string
  buyer_id: string
  book_id: string
  download_token: string
  download_count: number
  max_downloads: number
  expires_at: string
  last_downloaded: string | null
  created_at: string
  books?: Book
}

export interface Review {
  id: string
  book_id: string
  buyer_id: string
  rating: number
  title: string | null
  comment: string | null
  is_verified: boolean
  created_at: string
  profiles?: Profile
}

export interface CartItem {
  book: Book
  quantity: 1
}

export interface CheckoutPayload {
  items: CartItem[]
  promotion_code?: string
  buyer_email: string
  buyer_name: string
  payment_method: 'payfast' | 'stripe' | 'paypal' | 'coinbase'
}

export interface PriceBreakdown {
  subtotal: number
  discount: number
  vat: number
  total: number
  promotion: Promotion | null
}
