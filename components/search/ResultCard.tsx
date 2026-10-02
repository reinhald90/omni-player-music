'use client'

import Image from 'next/image'
import { Play, Clock, Eye, Pause } from 'lucide-react'
import type { Song } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { formatViews } from '@/lib/formatter'

interface Props {
  song: Song
}

export default function ResultCard({ song }: Props) {
  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const toggle = usePlayerStore((s) => s.toggle)
  const addHistory = useHistoryStore((s) => s.add)

  const isCurrentSong = current?.id === song.id
  const showPause = isCurrentSong && isPlaying

  const handlePlay = () => {
    if (isCurrentSong) {
      // Klik lagu yang sedang aktif → toggle play/pause
      toggle()
    } else {
      // Lagu baru → set + play + catat history
      setCurrent(song)
      addHistory(song)
    }
  }

  return (
    <div
      className={`glass rounded-2xl p-3 flex items-center gap-3 transition-all group ${
        isCurrentSong ? 'bg-brand/10 border-brand/30' : 'hover:bg-white/[0.06]'
      }`}
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-none bg-white/5">
        <Image
          src={song.thumbnail}
          alt={song.title}
          fill
          sizes="96px"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-1 right-1 text-[9px] font-black bg-black/80 px-1.5 py-0.5 rounded text-white/90">
          {song.duration}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-bold truncate leading-snug ${isCurrentSong ? 'text-brand' : ''}`}>
          {song.title}
        </h3>
        <p className="text-xs text-white/50 truncate mt-1">{song.artist}</p>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40 font-semibold">
          <span className="flex items-center gap-1">
            <Eye size={10} /> {formatViews(song.views)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} /> {song.duration}
          </span>
        </div>
      </div>

      <button
        onClick={handlePlay}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-light text-white flex items-center justify-center flex-none shadow-lg shadow-brand/40 hover:scale-110 active:scale-95 transition-all"
        aria-label={showPause ? 'Pause' : 'Play'}
      >
        {showPause ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" className="ml-0.5" />
        )}
      </button>
    </div>
  )
}
