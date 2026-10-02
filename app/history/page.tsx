'use client'

import Image from 'next/image'
import { useHistoryStore } from '@/store/historyStore'
import { usePlayerStore } from '@/store/playerStore'
import { usePlayerStore as ps } from '@/store/playerStore'
import { formatViews, formatTime } from '@/lib/formatter'
import { Play, Clock, Eye, Trash2, History as HistoryIcon, Music2 } from 'lucide-react'

export default function HistoryPage() {
  const items = useHistoryStore((s) => s.items)
  const clear = useHistoryStore((s) => s.clear)
  const remove = useHistoryStore((s) => s.remove)
  const setCurrent = ps((s) => s.setCurrent)
  const current = ps((s) => s.current)

  const handlePlay = (song: any) => {
    setCurrent(song)
  }

  const formatPlayedAt = (ts: number) => {
    const diff = Date.now() - ts
    const s = Math.floor(diff / 1000)
    if (s < 60) return `${s} detik lalu`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m} menit lalu`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} jam lalu`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d} hari lalu`
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-3">
            <HistoryIcon size={11} className="text-brand" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
              Riwayat
            </span>
          </div>
          <h1 className="text-2xl font-black gradient-text">Yang Pernah Kamu Putar</h1>
          <p className="text-xs text-white/40 mt-1">
            {items.length > 0 ? `${items.length} lagu tersimpan` : 'Belum ada lagu'}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Hapus semua riwayat?')) clear()
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
          >
            <Trash2 size={13} />
            Hapus
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Music2 size={40} className="mx-auto text-white/20 mb-4" />
          <p className="text-sm font-bold text-white/60">Belum ada riwayat</p>
          <p className="text-xs text-white/30 mt-1">
            Lagu yang kamu putar akan muncul di sini
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.map((song) => {
          const isCurrent = current?.id === song.id
          return (
            <div
              key={song.id}
              className={`glass rounded-2xl p-3 flex items-center gap-3 transition-all group ${
                isCurrent ? 'bg-brand/10 border border-brand/30' : 'hover:bg-white/[0.06]'
              }`}
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
                <h3 className={`text-sm font-bold truncate ${isCurrent ? 'text-brand' : ''}`}>
                  {song.title}
                </h3>
                <p className="text-xs text-white/50 truncate mt-0.5">{song.artist}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/40 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {formatPlayedAt(song.playedAt)}
                  </span>
                  {song.views > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye size={10} /> {formatViews(song.views)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => remove(song.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all flex-none opacity-0 group-hover:opacity-100"
                aria-label="Hapus"
              >
                <Trash2 size={14} />
              </button>

              <button
                onClick={() => handlePlay(song)}
                className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-brand-light text-white flex items-center justify-center flex-none shadow-lg shadow-brand/40 hover:scale-110 active:scale-95 transition-all"
                aria-label="Putar"
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
