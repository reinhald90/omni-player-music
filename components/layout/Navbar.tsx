'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SITE_CONFIG } from '@/lib/constants'
import { Home, History, Info, Radio } from 'lucide-react'
import { clsx } from 'clsx'

const icons: Record<string, React.ReactNode> = {
  '/': <Home size={18} />,
  '/history': <History size={18} />,
  '/about': <Info size={18} />,
  '/channel': <Radio size={18} />,
}

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-lg shadow-lg shadow-brand/30">
            🎧
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-black tracking-tight">
              {SITE_CONFIG.shortName}
            </div>
            <div className="text-[9px] text-white/40 tracking-[0.2em] uppercase font-bold">
              Premium Player
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {SITE_CONFIG.nav.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all',
                  active
                    ? 'bg-brand/15 text-brand border border-brand/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                {icons[item.href]}
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
