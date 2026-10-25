'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { usePlaylistStore } from '@/store/playlistStore'
import { useHistoryStore } from '@/store/historyStore'
import { BadgeCheck, LogOut, Calendar, ShieldCheck, Camera, Pencil, X, Check, Image as ImageIcon } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, initialized, logout, updateProfileData } = useAuthStore()
  const favorites = useFavoritesStore((s) => s.items)
  const playlists = usePlaylistStore((s) => s.playlists)
  const history = useHistoryStore((s) => s.items)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editCover, setEditCover] = useState('')
  const [saving, setSaving] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialized && !isAuthenticated) router.push('/')
    if (user) {
      setEditName(user.name)
      setEditAvatar(user.avatar || '')
      setEditCover(user.coverUrl || '')
    }
  }, [initialized, isAuthenticated, router, user])

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

  // Handle upload gambar (ubah ke base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      if (type === 'avatar') setEditAvatar(event.target?.result as string)
      if (type === 'cover') setEditCover(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfileData({ name: editName, avatar: editAvatar, coverUrl: editCover })
      setIsEditing(false)
    } catch (e) {
      alert('Gagal menyimpan profil')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      
      {/* === KARTU PROFIL === */}
      <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* === COVER / BACKGROUND === */}
        <div className="relative h-36 w-full bg-gradient-to-r from-brand via-brand-light to-brand-dark overflow-hidden group">
          {editCover || user.coverUrl ? (
            <img src={editCover || user.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          )}
          
          {/* Tombol ganti cover (Hanya muncul saat edit) */}
          {isEditing && (
            <button 
              onClick={() => coverInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ImageIcon size={16} /> Ganti Background
            </button>
          )}
          <input type="file" accept="image/*" ref={coverInputRef} onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" />
        </div>

        {/* === AVATAR & INFO === */}
        <div className="px-6 pb-6 relative">
          
          <div className="flex justify-between items-end -mt-12 mb-4">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-[#0a0a0e] p-1 shadow-xl relative z-10">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-brand to-brand-dark overflow-hidden flex items-center justify-center text-white text-3xl font-black">
                  {editAvatar || user.avatar ? (
                    <img src={editAvatar || user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                {/* Centang Biru */}
                {user.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-[#0a0a0e] rounded-full p-1 shadow-lg z-20">
                    <BadgeCheck size={24} className="text-blue-500 fill-blue-500/20" />
                  </div>
                )}
              </div>
              
              {/* Tombol ganti avatar (Hanya muncul saat edit) */}
              {isEditing && (
                <button 
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-1 rounded-full bg-black/60 flex items-center justify-center text-white z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={24} />
                </button>
              )}
              <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => handleImageUpload(e, 'avatar')} className="hidden" />
            </div>

            {/* Tombol Edit / Save */}
            <div className="mb-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all active:scale-95"
                >
                  <Pencil size={13} /> Edit Profil
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20">
                    <X size={16} />
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-lg shadow-brand/30 hover:scale-105 active:scale-95 disabled:opacity-50">
                    {saving ? 'Menyimpan...' : <><Check size={14} /> Simpan</>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Text Info */}
          <div>
            {isEditing ? (
              <input 
                type="text" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
                className="text-2xl font-black text-white bg-transparent border-b border-brand/50 outline-none w-full max-w-xs mb-1"
              />
            ) : (
              <div className="flex items-center gap-1.5 mb-1">
                <h1 className="text-2xl font-black text-white">{user.name}</h1>
                {user.isVerified && <BadgeCheck size={20} className="text-blue-500" />}
              </div>
            )}
            
            <p className="text-sm text-white/50">{user.email}</p>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck size={12} />
              Akun Terverifikasi
            </div>
          </div>
        </div>

        {/* === STATISTIK === */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Role</div>
              <div className="text-sm font-bold text-white uppercase">{user.role || 'User'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* === TOMBOL LOGOUT === */}
      <button
        onClick={() => { logout(); router.push('/') }}
        className="w-full mt-6 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-black uppercase tracking-wider hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        Keluar Akun
      </button>
    </div>
  )
}
