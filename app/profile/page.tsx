'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { usePlaylistStore } from '@/store/playlistStore'
import { useHistoryStore } from '@/store/historyStore'
import { BadgeCheck, LogOut, Calendar, ShieldCheck } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, initialized, logout } = useAuthStore()
  const favorites = useFavoritesStore((s) => s.items)
  const playlists = usePlaylistStore((s) => s.playlists)
  const history = useHistoryStore((s) => s.items)

  // Redirect ke home kalau belum login
  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.push('/')
    }
  }, [initialized, isAuthenticated, router])

  if (!initialized || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  const joinedDate = user.joinedAt 
    ? new Date(user.joinedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Baru saja'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      
      {/* === KARTU PROFIL === */}
      <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Background Cover */}
        <div className="h-32 w-full bg-gradient-to-r from-brand via-brand-light to-brand-dark relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </div>

        {/* Avatar & Info */}
        <div className="px-6 pb-6 relative">
          
          {/* Avatar melayang di tengah */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 rounded-full bg-[#0a0a0e] p-1 relative shadow-xl">
              {/* Pastikan lingkaran avatar mengunci gambar */}
              <div className="w-full h-full rounded-full bg-gradient-to-br from-brand to-brand-dark overflow-hidden flex items-center justify-center text-white text-3xl font-black">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full object-cover rounded-full" 
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              {/* Centang Biru */}
              <div className="absolute bottom-0 right-0 bg-[#0a0a0e] rounded-full p-1 shadow-lg">
                <BadgeCheck size={26} className="text-blue-500 fill-blue-500/20" />
              </div>
            </div>
          </div>

          {/* Text Info (Diberi jarak mt-16 agar tidak tertutup avatar) */}
          <div className="mt-16 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h1 className="text-2xl font-black text-white">{user.name}</h1>
              <BadgeCheck size={20} className="text-blue-500" />
            </div>
            <p className="text-sm text-white/50">{user.email}</p>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck size={12} />
              Akun Terverifikasi
            </div>
          </div>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-3 border-t border-white/5 divide-x divide-white/5">
          <div className="p-4 text-center">
            <div className="text-xl font-black text-white">{favorites.length}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-1">Lagu Favorit</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-xl font-black text-white">{playlists.length}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-1">Playlist</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-xl font-black text-white">{history.length}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-1">History</div>
          </div>
        </div>
      </div>

      {/* === DETAIL AKUN === */}
      <div className="mt-6 space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-white/40 px-1">Info Akun</h2>
        
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-none">
            <Calendar size={18} className="text-white/60" />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Bergabung Sejak</div>
            <div className="text-sm font-bold text-white">{joinedDate}</div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-none">
            <ShieldCheck size={18} className="text-white/60" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">ID Firebase (UID)</div>
            <div className="text-xs font-mono text-white/70 truncate">{user.id}</div>
          </div>
        </div>
      </div>

      {/* === TOMBOL LOGOUT === */}
      <button
        onClick={() => {
          logout()
          router.push('/')
        }}
        className="w-full mt-6 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-black uppercase tracking-wider hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        Keluar Akun
      </button>
    </div>
  )
}
