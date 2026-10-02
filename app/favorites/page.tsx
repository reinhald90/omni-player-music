'use client'

import Image from 'next/image'
import { useFavoritesStore } from '@/store/favoritesStore'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { formatViews } from '@/lib/formatter'
import { Play, Clock, Eye, Trash2, Heart, ListPlus, MoreVertical, X, SkipForward } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

export default function FavoritesPage() {
  const items = useFavoritesStore((s) => s.items)
  const remove = useFavoritesStore((s) => s.remove)
  const clear = useFavoritesStore((s) => s.clear)

  const current = usePlayerStore((s) => s.current)
  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const addToQueue = usePlayerStore((s) => s.addToQueue)
  const playNext = usePlayerStore((s) => s.playNext)
  const addHistory = useHistoryStore((s) => s.add)

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const handlePlay = (song: any) => {
    if (current?.id === song.id) return
    setCurrent(song)
    addHistory(song)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-3">
            <Heart size={11} className="text-brand" fill="currentColor" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
              Favorit
            </span>
          </div>
          <h1 className="text-2xl font-black gradient-text">Lagu Kesukaanmu</h1>
          <p className="text-xs text-white/40 mt-1">
            {items.length > 0 ? `${items.length} lagu tersimpan` : 'Belum ada lagu favorit'}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Hapus semua favorit?')) clear()
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
          >
            <Trash2 size={13} />
            Hapus
          </button>
        )}
      </div>

      {/* Empty */}
      {items.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Heart size={40} className="mx-auto text-white/20 mb-4" />
          <p className="text-sm font-bold text-white/60">Belum ada favorit</p>
          <p className="text-xs text-white/30 mt-1">
            Tap ikon ❤️ di lagu untuk menyimpannya di sini
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.map((song) => {
          const isCurrent = current?.id === song.id
          const menuOpen = menuOpenId === song.id
          return (
            <div
              key={song.id}
              className={clsx(
                'glass rounded-2xl p-3 flex items-center gap-3 transition-all group relative',
                isCurrent ? 'bg-brand/10 border border-brand/30' : 'hover:bg-white/[0.06]'
              )}
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-none bg-white/5">
                <Image
                  src={song.thumbnail}
                  alt={song.title}
                  fill
                  sizes="80px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={clsx(
                    'text-sm font-bold truncate',
                    isCurrent ? 'text-brand' : ''
                  )}
                >
                  {song.title}
                </h3>
                <p className="text-xs text-white/50 truncate mt-0.5">{song.artist}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/40 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {song.duration}
                  </span>
                  {song.views > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye size={10} /> {formatViews(song.views)}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu */}
              <div className="relative flex-none">
                <button
                  onClick={() => setMenuOpenId(menuOpen ? null : song.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                >
                  {menuOpen ? <X size={14} /> : <MoreVertical size={14} />}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                    <div className="absolute right-0 top-10 z-50 w-44 py-1.5 rounded-2xl glass-strong border border-white/10 shadow-2xl overflow-hidden animate-[fadeIn_0.15s]">
                      <button
                        onClick={() => {
                          playNext(song)
                          setMenuOpenId(null)
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 text-left"
                      >
                        <SkipForward size={14} className="text-brand" />
                        Putar Setelahnya
                      </button>
                      <button
                        onClick={() => {
                          addToQueue(song)
                          setMenuOpenId(null)
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 text-left"
                      >
                        <ListPlus size={14} className="text-cyan-400" />
                        Tambah ke Antrian
                      </button>
                      <button
                        onClick={() => {
                          remove(song.id)
                          setMenuOpenId(null)
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 text-left"
                      >
                        <Trash2 size={14} />
                        Hapus dari Favorit
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Play */}
              <button
                onClick={() => handlePlay(song)}
                className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-brand-light text-white flex items-center justify-center flex-none shadow-lg shadow-brand/40 hover:scale-110 active:scale-95 transition-all"
              >
                <Play size={16} fill="currentColor" className="ml-0.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
