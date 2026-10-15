import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/account', '/publisher/dashboard', '/admin']
const AUTH_ROUTES = ['/auth/login', '/auth/register']
const PUBLISHER_ROUTES = ['/publisher/dashboard']
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Redirect authenticated users away from auth pages
  if (user && AUTH_ROUTES.some((r) => path.startsWith(r))) {
    return NextResponse.redirect(new URL('/account', request.url))
  }

  // Require login for protected routes
  if (!user && PROTECTED_ROUTES.some((r) => path.startsWith(r))) {
    return NextResponse.redirect(new URL(`/auth/login?redirect=${encodeURIComponent(path)}`, request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Publisher routes require publisher or admin role
    if (PUBLISHER_ROUTES.some((r) => path.startsWith(r)) && profile?.role === 'buyer') {
      return NextResponse.redirect(new URL('/publisher/register', request.url))
    }

    // Admin routes require admin role
    if (ADMIN_ROUTES.some((r) => path.startsWith(r)) && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
