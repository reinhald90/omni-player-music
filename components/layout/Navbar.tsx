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

  const { user, isAuthenticated, logout } = useAuthStore()

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

  return (
    <>
      {/* Navbar Solid Hitam, tanpa efek blur kaca */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          
          {/* Kiri: Menu Toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex-none"
          >
            <Menu size={20} />
          </button>

          {/* Tengah: Logo & Nama */}
          <Link href="/" className="flex items-center gap-2.5 flex-1 justify-center sm:justify-start">
            <div className="relative w-8 h-8 rounded-full overflow-hidden flex-none">
              <Image src="/icon.png" alt={SITE_CONFIG.shortName} fill sizes="32px" className="object-cover" priority />
            </div>
            <span className="text-base font-black tracking-tight hidden sm:block">
              {SITE_CONFIG.shortName}
            </span>
          </Link>

          {/* Kanan: Auth & Theme */}
          <div className="flex items-center gap-2 flex-none">
            <ThemeSwitcher />

            {!isAuthenticated ? (
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => openAuth('login')}
                  className="px-4 py-2 rounded-full text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  Masuk
                </button>
                {/* Tombol Putih Solid ala Spotify */}
                <button
                  onClick={() => openAuth('register')}
                  className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all"
                >
                  Daftar
                </button>
              </div>
            ) : (
              <div className="relative ml-2" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-white truncate max-w-[80px]">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className="text-white/50" />
                </button>

                {/* Dropdown Menu Solid */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-56 bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                      <div className="text-sm font-bold truncate text-white">{user?.name}</div>
                      <div className="text-[11px] text-white/50 truncate">{user?.email}</div>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <UserIcon size={16} /> Profil Saya
                      </Link>
                      <button
                        onClick={() => {
                          logout()
                          setUserMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all text-left"
                      >
                        <LogOut size={16} /> Keluar Akun
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  )
}
