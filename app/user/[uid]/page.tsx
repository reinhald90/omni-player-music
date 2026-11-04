'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { BadgeCheck, ArrowLeft, Play, Music2, Loader2, Calendar, ShieldCheck } from 'lucide-react'
import type { Song } from '@/types'
import { clsx } from 'clsx'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string | null
  coverUrl: string | null
  isVerified: boolean
  role: string
  joinedAt: number
}

interface CommunitySong {
  id: string
  user_id: string
  uploader_name: string
  title: string
  artist: string
  cover_url: string | null
  audio_url: string
  created_at: string
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const uid = params.uid as string

  const [data, setData] = useState<{ user: UserProfile, songs: CommunitySong[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const current = usePlayerStore((s) => s.current)
  const addHistory = useHistoryStore((s) => s.add)

  useEffect(() => {
    if (!uid) return
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/db/users/${uid}`)
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.error)
        }
      } catch (e: any) {
        setError('Gagal memuat profil')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [uid])

  const handlePlay = (song: CommunitySong) => {
    const playerSong: Song = {
      id: song.id,
      title: song.title,
      artist: song.artist || song.uploader_name,
      duration: '0:00', 
      durationSec: 0,
      views: 0,
      thumbnail: song.cover_url || '/icon.png',
      url: song.audio_url,
      audioUrl: song.audio_url
    }
    setCurrent(playerSong)
    addHistory(playerSong)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand" size={32} /></div>
  if (error || !data) return <div className="text-center py-20 text-red-400">{error || 'User tidak ditemukan'}</div>

  const { user, songs } = data
  const joinedDate = new Date(user.joinedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={14} /> Kembali
      </button>

      {/* Kartu Profil */}
      <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl relative mb-8">
        <div className="relative h-36 w-full bg-gradient-to-r from-brand/40 via-brand-light/20 to-brand-dark/40 overflow-hidden">
          {user.coverUrl && <img src={user.coverUrl} alt="Cover" className="w-full h-full object-cover opacity-60" />}
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-[#0a0a0e] p-1 shadow-xl relative z-10">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-brand to-brand-dark overflow-hidden flex items-center justify-center text-white text-3xl font-black">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                {user.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-[#0a0a0e] rounded-full p-1 shadow-lg z-20">
                    <BadgeCheck size={24} className="text-blue-500 fill-blue-500/20" />
                  </div>
                )}
              </div>
            </div>
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/60">
              Role: {user.role}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <h1 className="text-2xl font-black text-white">{user.name}</h1>
              {user.isVerified && <BadgeCheck size={20} className="text-blue-500" />}
            </div>
            <p className="text-sm text-white/50">{user.email}</p>
            
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-white/60 font-semibold">
                <Calendar size={14} /> Gabung {joinedDate}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/60 font-semibold">
                <Music2 size={14} /> {songs.length} Lagu di-upload
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lagu-lagu yang di-upload */}
      <h2 className="text-lg font-black mb-4 flex items-center gap-2">
        <Music2 size={18} className="text-brand" /> Karya {user.name}
      </h2>
      
      {songs.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-white/40 text-sm">
          User ini belum mengunggah lagu apapun.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {songs.map((song) => {
            const isCurrent = current?.id === song.id
            return (
              <div key={song.id} onClick={() => handlePlay(song)} className="group relative bg-[#121212] hover:bg-[#1a1a1a] p-3 rounded-2xl cursor-pointer transition-all">
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3">
                  {song.cover_url ? (
                    <Image src={song.cover_url} alt={song.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-brand/20 flex items-center justify-center"><Music2 className="text-brand/50" /></div>
                  )}
                  <div className={clsx("absolute bottom-2 right-2 w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shadow-lg transition-all", isCurrent ? "opacity-100" : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0")}>
                    <Play size={16} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
                <h3 className={clsx("text-sm font-bold truncate", isCurrent ? "text-brand" : "text-white")}>{song.title}</h3>
                <p className="text-[11px] text-white/50 truncate mt-1">{song.artist}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
