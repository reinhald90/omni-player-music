'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, LogIn, UserPlus, LogOut, ChevronDown, User as UserIcon } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import Sidebar from './Sidebar'
import ThemeSwitcher from './ThemeSwitcher'
import AuthModal from '@/components/auth/AuthModal'

export default function Navbar() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Ambil state auth dari Firebase
  const { user, isAuthenticated, logout } = useAuthStore()

  // Tutup menu profil kalau klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  const getPageTitle = () => {
    if (pathname === '/') return 'Cari Lagu'
    const item = SITE_CONFIG.nav.find(
      (n) => pathname.startsWith(n.href) && n.href !== '/'
    )
    return item?.label || 'Omni Player'
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          
          {/* Kiri: Hamburger Menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 active:scale-90 transition-all flex-none"
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>

          {/* Tengah: Logo & Nama Web */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group flex-1 min-w-0 justify-center sm:justify-start"
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-lg shadow-brand/30 flex-none ring-1 ring-white/10 group-hover:scale-105 transition-transform">
              <Image
                src="/icon.png"
                alt={SITE_CONFIG.shortName}
                fill
                sizes="36px"
                className="object-cover"
                priority
              />
            </div>
            <div className="hidden sm:block min-w-0">
              <div className="text-sm font-black tracking-tight leading-tight truncate">
                {SITE_CONFIG.shortName}
              </div>
              <div className="text-[9px] text-white/40 tracking-[0.2em] uppercase font-bold truncate">
                {getPageTitle()}
              </div>
            </div>
          </Link>

          {/* Kanan: Theme + Tombol Login / Profil */}
          <div className="flex items-center gap-2 flex-none">
            <ThemeSwitcher />

            {!isAuthenticated ? (
              // ==========================================
              // TAMPILAN JIKA BELUM LOGIN (GUEST)
              // ==========================================
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  onClick={() => openAuth('login')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 border border-white/10 transition-all active:scale-95"
                >
                  <LogIn size={13} />
                  <span className="hidden sm:inline">Masuk</span>
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-brand to-brand-light text-white text-xs font-bold shadow-lg shadow-brand/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <UserPlus size={13} />
                  <span className="hidden sm:inline">Daftar</span>
                </button>
              </div>
            ) : (
              // ==========================================
              // TAMPILAN JIKA SUDAH LOGIN
              // ==========================================
              <div className="relative ml-1" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-xs font-black shadow-md overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-white truncate max-w-[80px]">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={12} className="text-white/50" />
                </button>

                {/* Dropdown Profil */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl glass-strong border border-white/10 shadow-2xl overflow-hidden animate-[fadeIn_0.15s]">
                    <div className="p-3 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-sm font-black flex-none shadow-md overflow-hidden">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user?.name?.charAt(0).toUpperCase() || '?'
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{user?.name}</div>
                          <div className="text-[10px] text-white/40 truncate">{user?.email}</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-white/80 hover:bg-white/10 transition-all text-left"
                      >
                        <UserIcon size={14} />
                        Profil Saya
                      </Link>
                      <button
                        onClick={() => {
                          logout()
                          setUserMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all text-left"
                      >
                        <LogOut size={14} />
                        Keluar Akun
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar Menu Kiri */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Modal Login/Daftar */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  )
}
