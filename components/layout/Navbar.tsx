'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/components/cart/CartProvider'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import {
  ShoppingCart, BookOpen, User, Menu, X, Search,
  ChevronDown, Sun, Moon, LogOut, LayoutDashboard, Shield,
} from 'lucide-react'
import type { Profile } from '@/types'

export default function Navbar() {
  const { itemCount } = useCart()
  const [user, setUser] = useState<Profile | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Auth listener
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        setUser(data)
      }
    }
    getUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) setUser(null)
      else getUser()
    })
    return () => subscription.unsubscribe()
  }, [])

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Dark mode (persist to localStorage)
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const isDark = stored ? stored === 'dark' : true
    setDarkMode(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
    window.location.href = '/'
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) window.location.href = `/books?q=${encodeURIComponent(search)}`
  }

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-nav shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'glass-nav'
      }`}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative shrink-0" style={{ width: 38, height: 38 }}>
              <Image src="/logo-mark-dark.png" alt="Read.ify" fill sizes="38px" className="object-contain" priority />
            </div>
            <span className="font-extrabold text-xl tracking-tight font-display hidden sm:block">
              <span className="text-white">Read</span>
              <span className="text-gold-500">.</span>
              <span className="text-white">ify</span>
            </span>
          </Link>

          {/* ── Search (desktop) ── */}
          <form
            className="hidden md:flex flex-1 max-w-sm mx-4"
            onSubmit={handleSearch}
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search ebooks, authors…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.9)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(245,166,35,0.5)'
                  e.target.style.background = 'rgba(255,255,255,0.09)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.target.style.background = 'rgba(255,255,255,0.06)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </form>

          {/* ── Desktop nav ── */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/books"
              className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/05"
            >
              Browse
            </Link>
            <Link
              href="/publisher/register"
              className="px-3 py-2 text-sm font-medium text-white/70 hover:text-gold-400 transition-colors rounded-xl"
            >
              Sell Books
            </Link>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/08 transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cart */}
            <Link href="/cart" aria-label="Cart" className="relative p-2 text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/08">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#f5a623,#d97706)', color: '#0a0f1e' }}>
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/08 transition-all"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg,#f5a623,#d97706)', color: '#0a0f1e' }}
                  >
                    {(user.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="max-w-[90px] truncate hidden lg:block">{user.full_name || 'Account'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 py-1 rounded-2xl z-50 overflow-hidden"
                    style={{
                      background: 'rgba(17,24,39,0.96)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                    }}
                  >
                    <Link href="/account"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/08 transition-colors"
                      onClick={() => setUserMenuOpen(false)}>
                      <User className="w-4 h-4 text-gold-500" /> My Library
                    </Link>
                    {(user.role === 'publisher' || user.role === 'admin') && (
                      <Link href="/publisher/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/08 transition-colors"
                        onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard className="w-4 h-4 text-gold-500" /> Publisher Dashboard
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link href="/admin/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/08 transition-colors"
                        onClick={() => setUserMenuOpen(false)}>
                        <Shield className="w-4 h-4 text-gold-500" /> Admin Panel
                      </Link>
                    )}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} className="mt-1 pt-1">
                      <button onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/08 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Login
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm px-4 py-2">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile right ── */}
          <div className="flex md:hidden items-center gap-1">
            <button onClick={toggleDark} className="p-2 text-white/60 hover:text-white" aria-label="Toggle theme">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/cart" aria-label="Cart" className="relative p-2 text-white/70">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#f5a623,#d97706)', color: '#0a0f1e' }}>
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-white/70 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 py-4 space-y-1"
          style={{
            background: 'rgba(10,15,30,0.97)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <form className="mb-4" onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search ebooks…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.9)',
                }}
              />
            </div>
          </form>
          {[
            { label: 'Browse Books', href: '/books' },
            { label: 'Sell Books', href: '/publisher/register' },
          ].map((l) => (
            <Link key={l.href} href={l.href}
              className="block py-2.5 px-2 text-sm font-medium text-white/80 hover:text-white"
              onClick={() => setMobileOpen(false)}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/account"
                className="flex items-center gap-2 py-2.5 px-2 text-sm font-medium text-white/80"
                onClick={() => setMobileOpen(false)}>
                <User className="w-4 h-4 text-gold-500" /> My Library
              </Link>
              {(user.role === 'publisher' || user.role === 'admin') && (
                <Link href="/publisher/dashboard"
                  className="flex items-center gap-2 py-2.5 px-2 text-sm font-medium text-white/80"
                  onClick={() => setMobileOpen(false)}>
                  <BookOpen className="w-4 h-4 text-gold-500" /> Publisher Dashboard
                </Link>
              )}
              <button onClick={handleSignOut}
                className="flex items-center gap-2 py-2.5 px-2 text-sm font-medium text-red-400 w-full text-left">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link href="/auth/login" className="btn-outline text-sm flex-1 text-center py-2.5 text-white/80"
                onClick={() => setMobileOpen(false)}>
                Login
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm flex-1 text-center py-2.5"
                onClick={() => setMobileOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
