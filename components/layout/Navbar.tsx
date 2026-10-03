'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'
import Sidebar from './Sidebar'
import ThemeSwitcher from './ThemeSwitcher'

export default function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

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
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-3">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 active:scale-90 transition-all flex-none"
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>

          {/* Brand */}
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

          {/* Right */}
          <div className="flex items-center gap-2 flex-none">
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  )
}
