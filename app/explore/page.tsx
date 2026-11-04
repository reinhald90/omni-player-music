'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { Play, Music2, Loader2, Sparkles, User } from 'lucide-react'
import type { Song } from '@/types'
import { clsx } from 'clsx'

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

export default function ExplorePage() {
  const [songs, setSongs] = useState<CommunitySong[]>([])
  const [loading, setLoading] = useState(true)

  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const current = usePlayerStore((s) => s.current)
  const addHistory = useHistoryStore((s) => s.add)

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await fetch('/api/db/community-songs')
        const json = await res.json()
        if (json.success) setSongs(json.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchSongs()
  }, [])

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-3">
            <Sparkles size={12} className="text-brand" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">Komunitas</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black gradient-text tracking-tight mb-2">Fresh Drops</h1>
          <p className="text-sm text-white/50 max-w-md">Lagu-lagu keren yang baru saja diunggah oleh kreator Omni Player.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-brand" /></div>
      ) : songs.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center max-w-lg mx-auto mt-10">
          <Music2 size={48} className="mx-auto text-white/20 mb-4" />
          <p className="text-lg font-bold text-white/80 mb-2">Belum Ada Lagu</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {songs.map((song) => {
            const isCurrent = current?.id === song.id
            return (
              <div key={song.id} className="group relative bg-[#121212] hover:bg-[#1a1a1a] transition-all duration-300 p-3 sm:p-4 rounded-2xl">
                <div onClick={() => handlePlay(song)} className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 shadow-lg bg-white/5 cursor-pointer">
                  {song.cover_url ? (
                    <Image src={song.cover_url} alt={song.title} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand/30 to-brand-dark/30"><Music2 size={32} className="text-white/40" /></div>
                  )}
                  <div className={clsx("absolute bottom-2 right-2 w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-xl shadow-brand/40 transition-all duration-300 z-10", isCurrent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0")}>
                    <Play size={20} fill="currentColor" className="ml-1" />
                  </div>
                </div>

                <div className="min-w-0">
                  <h3 className={clsx("text-sm font-bold truncate mb-1", isCurrent ? "text-brand" : "text-white")}>{song.title}</h3>
                  <p className="text-xs text-white/50 truncate mb-3">{song.artist}</p>
                  
                  {/* Link ke Profil Uploader */}
                  <Link 
                    href={`/user/${song.user_id}`}
                    className="flex items-center gap-1.5 pt-2 border-t border-white/5 hover:text-brand transition-colors group/link"
                  >
                    <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center flex-none group-hover/link:bg-brand/20">
                      <User size={9} className="text-white/60 group-hover/link:text-brand" />
                    </div>
                    <span className="text-[10px] text-white/40 truncate font-semibold group-hover/link:text-brand">
                      {song.uploader_name}
                    </span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
