'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { Play, Music2, User, Loader2, Compass } from 'lucide-react'
import type { Song } from '@/types'

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
    // Konversi format CommunitySong ke format Song (yang dipakai Player)
    const playerSong: Song = {
      id: song.id,
      title: song.title,
      artist: song.artist || song.uploader_name,
      duration: '0:00', // Durasi belum tersedia di DB, player akan deteksi otomatis
      durationSec: 0,
      views: 0,
      thumbnail: song.cover_url || '/icon.png', // Pakai logo kalau gak ada cover
      url: song.audio_url, // Ini penting: Player akan memutar URL ini
      audioUrl: song.audio_url // Kita bypass API stream karena ini file langsung
    }
    
    setCurrent(playerSong)
    addHistory(playerSong)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <Compass size={12} className="text-brand" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
            Komunitas
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black gradient-text mb-2">
          Eksplorasi Musik
        </h1>
        <p className="text-sm text-white/50">
          Dengerin lagu karya kreator lain dari seluruh penjuru
        </p>
      </div>

      {/* List Lagu */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand" />
        </div>
      ) : songs.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Music2 size={40} className="mx-auto text-white/20 mb-4" />
          <p className="text-sm font-bold text-white/60">Belum ada lagu komunitas</p>
          <p className="text-xs text-white/30 mt-1 mb-5">
            Jadilah kreator pertama yang mengunggah karya!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {songs.map((song) => {
            const isCurrent = current?.id === song.id
            return (
              <div 
                key={song.id} 
                className={`glass rounded-2xl overflow-hidden group cursor-pointer transition-all ${isCurrent ? 'bg-brand/10 border-brand/30' : 'hover:bg-white/[0.06]'}`}
                onClick={() => handlePlay(song)}
              >
                {/* Cover */}
                <div className="relative aspect-square w-full bg-white/5">
                  {song.cover_url ? (
                    <Image
                      src={song.cover_url}
                      alt={song.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand/20 to-brand-dark/20">
                      <Music2 size={32} className="text-white/30" />
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/40 transform scale-75 group-hover:scale-100 transition-transform">
                      <Play size={20} fill="currentColor" className="ml-1" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className={`text-sm font-bold truncate ${isCurrent ? 'text-brand' : 'text-white'}`}>
                    {song.title}
                  </h3>
                  <p className="text-[11px] text-white/50 truncate mt-0.5">{song.artist}</p>
                  
                  {/* Uploader */}
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
                    <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center flex-none">
                      <User size={8} className="text-white/50" />
                    </div>
                    <span className="text-[9px] text-white/40 truncate">
                      {song.uploader_name}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
