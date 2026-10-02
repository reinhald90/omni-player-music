'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  Play,
  Clock,
  Eye,
  Pause,
  MoreVertical,
  ListPlus,
  SkipForward,
  X,
  Heart,
} from 'lucide-react'
import type { Song } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { formatViews } from '@/lib/formatter'
import { clsx } from 'clsx'

interface Props {
  song: Song
}

export default function ResultCard({ song }: Props) {
  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const toggle = usePlayerStore((s) => s.toggle)
  const addToQueue = usePlayerStore((s) => s.addToQueue)
  const playNext = usePlayerStore((s) => s.playNext)
  const addHistory = useHistoryStore((s) => s.add)

  const isFav = useFavoritesStore((s) => s.isFavorite(song.id))
  const toggleFav = useFavoritesStore((s) => s.toggle)

  const [menuOpen, setMenuOpen] = useState(false)

  const isCurrentSong = current?.id === song.id
  const showPause = isCurrentSong && isPlaying

  const handlePlay = () => {
    if (isCurrentSong) {
      toggle()
    } else {
      setCurrent(song)
      addHistory(song)
    }
  }

  return (
    <div
      className={clsx(
        'glass rounded-2xl p-3 flex items-center gap-3 transition-all group relative',
        isCurrentSong ? 'bg-brand/10 border-brand/30' : 'hover:bg-white/[0.06]'
      )}
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
        {/* Favorite overlay button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFav(song)
          }}
          className={clsx(
            'absolute top-1 left-1 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90',
            isFav
              ? 'bg-brand/90 text-white'
              : 'bg-black/50 text-white/70 hover:bg-black/70 hover:text-white opacity-0 group-hover:opacity-100'
          )}
          aria-label="Favorit"
        >
          <Heart size={13} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <h3
          className={clsx(
            'text-sm font-bold truncate leading-snug',
            isCurrentSong ? 'text-brand' : ''
          )}
        >
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

      {/* Menu button */}
      <div className="relative flex-none">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
          aria-label="Menu"
        >
          {menuOpen ? <X size={16} /> : <MoreVertical size={16} />}
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-11 z-50 w-44 py-1.5 rounded-2xl glass-strong border border-white/10 shadow-2xl overflow-hidden animate-[fadeIn_0.15s]">
              <button
                onClick={() => {
                  playNext(song)
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 text-left"
              >
                <SkipForward size={14} className="text-brand" />
                Putar Setelahnya
              </button>
              <button
                onClick={() => {
                  addToQueue(song)
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 text-left"
              >
                <ListPlus size={14} className="text-cyan-400" />
                Tambah ke Antrian
              </button>
              <button
                onClick={() => {
                  toggleFav(song)
                  setMenuOpen(false)
                }}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-left',
                  isFav
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-white/80 hover:bg-white/10'
                )}
              >
                <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
                {isFav ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Play button */}
      <button
        onClick={handlePlay}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-light text-white flex items-center justify-center flex-none shadow-lg shadow-brand/40 hover:scale-110 active:scale-95 transition-all"
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
