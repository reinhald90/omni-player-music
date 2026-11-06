'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  X, Home, Heart, ListMusic, History, BarChart3, Info, Radio, ExternalLink, MessageSquare, UploadCloud, Compass, Clapperboard, Trophy, Wrench, Bot
} from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Beranda' },
  { href: '/ai', icon: Bot, label: 'Omni AI' }, // <-- Menu AI Baru
  { href: '/reels', icon: Clapperboard, label: 'Reels' },
  { href: '/explore', icon: Compass, label: 'Eksplorasi' },
  { href: '/leaderboard', icon: Trophy, label: 'Papan Peringkat' },
  { href: '/tools', icon: Wrench, label: 'Border Studio' },
  { href: '/upload', icon: UploadCloud, label: 'Upload Musik' },
  { href: '/chat', icon: MessageSquare, label: 'Chat Global' },
  { href: '/favorites', icon: Heart, label: 'Favorit' },
  { href: '/playlists', icon: ListMusic, label: 'Playlist' },
  { href: '/history', icon: History, label: 'Riwayat' },
  { href: '/stats', icon: BarChart3, label: 'Statistik' },
  { href: '/about', icon: Info, label: 'Tentang' },
  { href: '/channel', icon: Radio, label: 'Saluran' },
]

interface Props { open: boolean; onClose: () => void }

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname()

  return (
    <>
      <div className={clsx('fixed inset-0 z-[95] bg-black/80 transition-opacity duration-300', open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none')} onClick={onClose} />
      <aside className={clsx('fixed top-0 left-0 bottom-0 z-[96] w-[280px] max-w-[85vw] bg-[#0a0a0a] border-r border-white/5 transition-transform duration-300 flex flex-col', open ? 'translate-x-0' : '-translate-x-full')} style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}>
        <div className="flex items-center justify-between px-5 py-5 flex-none">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-none border border-white/10"><Image src="/icon.png" alt="OPM" fill sizes="40px" className="object-cover" /></div>
            <div className="min-w-0"><div className="text-base font-black truncate text-white">Omni Player</div><div className="text-[9px] text-white/40 tracking-[0.2em] uppercase font-bold">Premium Music</div></div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all flex-none"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} onClick={onClose} className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]', active ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:text-white hover:bg-white/5 font-semibold')}>
                <Icon size={18} className={active ? 'text-white' : 'text-white/40'} />
                <span className="text-[13px]">{item.label}</span>
              </Link>
            )
          })}
        </div>
        <div className="p-4 flex-none border-t border-white/5">
          <a href={SITE_CONFIG.channel.url} target="_blank" rel="noopener noreferrer" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group">
            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white/70 group-hover:text-white flex-none"><Radio size={14} /></div>
            <div className="flex-1 min-w-0"><div className="text-xs font-bold text-white/80 group-hover:text-white">Saluran WhatsApp</div></div>
            <ExternalLink size={14} className="text-white/30 flex-none" />
          </a>
          <div className="text-center text-[9px] text-white/20 mt-4 tracking-[0.2em] uppercase font-bold">v1.0</div>
        </div>
      </aside>
    </>
  )
}
