'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  X,
  Home,
  Heart,
  ListMusic,
  History,
  BarChart3,
  Info,
  Radio,
  ExternalLink,
} from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Beranda', desc: 'Cari & putar lagu' },
  { href: '/favorites', icon: Heart, label: 'Favorit', desc: 'Lagu kesukaanmu' },
  { href: '/playlists', icon: ListMusic, label: 'Playlist', desc: 'Koleksi pribadi' },
  { href: '/history', icon: History, label: 'Riwayat', desc: 'Yang pernah diputar' },
  { href: '/stats', icon: BarChart3, label: 'Statistik', desc: 'Rekap aktivitas' },
  { href: '/about', icon: Info, label: 'Tentang', desc: 'Info aplikasi' },
  { href: '/channel', icon: Radio, label: 'Saluran', desc: 'Update terbaru' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname()

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 bottom-0 z-[96] w-[310px] max-w-[85vw] bg-[#0a0a0e] border-r border-white/5 transition-transform duration-300 flex flex-col shadow-2xl',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-none">
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 shadow-lg shadow-brand/30 flex-none">
              <Image
                src="/icon.png"
                alt="OPM"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black truncate">Omni Player</div>
              <div className="text-[9px] text-white/40 tracking-[0.2em] uppercase font-bold">
                Premium Music
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 active:scale-90 transition-all flex-none"
            aria-label="Tutup menu"
          >
            <X size={15} />
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <div className="px-2 py-2">
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30">
              Menu Utama
            </div>
          </div>

          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all active:scale-[0.98]',
                  active
                    ? 'bg-brand/15 border border-brand/30'
                    : 'hover:bg-white/5 border border-transparent'
                )}
              >
                <div
                  className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-none transition-colors',
                    active
                      ? 'bg-brand/20 text-brand'
                      : 'bg-white/5 text-white/60'
                  )}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={clsx(
                      'text-sm font-bold truncate',
                      active ? 'text-brand' : 'text-white'
                    )}
                  >
                    {item.label}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">
                    {item.desc}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 flex-none">
          <a
            href={SITE_CONFIG.channel.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-none">
              <Radio size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-emerald-400">
                Saluran WhatsApp
              </div>
              <div className="text-[10px] text-white/40 truncate">
                Update terbaru
              </div>
            </div>
            <ExternalLink size={13} className="text-emerald-400 flex-none" />
          </a>
          <div className="text-center text-[9px] text-white/20 mt-3 tracking-[0.3em] uppercase font-bold">
            v1.0 · Made with ♥
          </div>
        </div>
      </aside>
    </>
  )
}
