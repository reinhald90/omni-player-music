'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Play, Clock, Eye, Pause, MoreVertical, ListPlus, SkipForward, X, Heart, ListMusic } from 'lucide-react'
import type { Song } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { formatViews } from '@/lib/formatter'
import { clsx } from 'clsx'
import AddToPlaylistModal from '@/components/playlist/AddToPlaylistModal'

interface Props { song: Song }

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
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false)

  const isCurrentSong = current?.id === song.id
  const showPause = isCurrentSong && isPlaying

  const handlePlay = () => {
    if (isCurrentSong) toggle()
    else { setCurrent(song); addHistory(song) }
  }

  return (
    <>
      <div className={clsx('group relative flex items-center gap-3 p-3 rounded-xl transition-all border', isCurrentSong ? 'bg-white/10 border-white/10' : 'bg-transparent border-transparent hover:bg-white/5')}>
        
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-none bg-[#1a1a1a]">
          <Image src={song.thumbnail} alt={song.title} fill sizes="64px" className="object-cover" />
          {status === 'loading' && <div className="absolute inset-0 bg-black/50" />}
          <button onClick={(e) => { e.stopPropagation(); toggleFav(song) }} className={clsx('absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-all', isFav ? 'bg-white text-black' : 'bg-black/50 text-white/70 hover:bg-black/80 hover:text-white opacity-0 group-hover:opacity-100')}>
            <Heart size={12} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={clsx('text-sm font-bold truncate', isCurrentSong ? 'text-white' : 'text-white/90')}>{song.title}</h3>
          <p className="text-xs text-white/50 truncate mt-1">{song.artist}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/40 font-semibold">
            <span className="flex items-center gap-1"><Eye size={10} /> {formatViews(song.views)}</span>
            <span className="flex items-center gap-1"><Clock size={10} /> {song.duration}</span>
          </div>
        </div>

        <div className="relative flex-none">
          <button onClick={() => setMenuOpen((v) => !v)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 active:scale-90 transition-all">
            {menuOpen ? <X size={16} /> : <MoreVertical size={16} />}
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-50 w-48 py-1.5 rounded-xl bg-[#121212] border border-white/10 shadow-2xl overflow-hidden animate-[fadeIn_0.15s]">
                <button onClick={() => { playNext(song); setMenuOpen(false) }} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 text-left"><SkipForward size={14} /> Putar Setelahnya</button>
                <button onClick={() => { addToQueue(song); setMenuOpen(false) }} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 text-left"><ListPlus size={14} /> Tambah ke Antrian</button>
                <button onClick={() => { setPlaylistModalOpen(true); setMenuOpen(false) }} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 text-left"><ListMusic size={14} /> Tambah ke Playlist</button>
                <button onClick={() => { toggleFav(song); setMenuOpen(false) }} className={clsx('w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-left', isFav ? 'text-red-400 hover:bg-red-500/10' : 'text-white/80 hover:bg-white/10')}><Heart size={14} fill={isFav ? 'currentColor' : 'none'} /> {isFav ? 'Hapus Favorit' : 'Favorit'}</button>
              </div>
            </>
          )}
        </div>

        <button onClick={handlePlay} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center flex-none hover:scale-105 active:scale-95 transition-all">
          {showPause ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>
      <AddToPlaylistModal song={song} open={playlistModalOpen} onClose={() => setPlaylistModalOpen(false)} />
    </>
  )
}
