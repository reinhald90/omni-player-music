'use client'

import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { usePlaylistStore } from '@/store/playlistStore'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { formatViews } from '@/lib/formatter'
import {
  Play,
  Trash2,
  ArrowLeft,
  ListMusic,
  Shuffle,
  Music2,
  Clock,
  Eye,
  PlayCircle,
} from 'lucide-react'
import { clsx } from 'clsx'

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId =
    typeof params.id === 'string' ? params.id : params.id?.[0]

  const playlist = usePlaylistStore((s) =>
    s.playlists.find((p) => p.id === playlistId)
  )
  const removeSong = usePlaylistStore((s) => s.removeSong)
  const removePlaylist = usePlaylistStore((s) => s.remove)

  const current = usePlayerStore((s) => s.current)
  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const setQueue = usePlayerStore((s) => s.setQueue)
  const addHistory = useHistoryStore((s) => s.add)

  if (!playlist) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Music2 size={40} className="mx-auto text-white/20 mb-4" />
        <p className="text-sm font-bold text-white/60">Playlist tidak ditemukan</p>
        <button
          onClick={() => router.push('/playlists')}
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass text-xs font-bold text-white/70"
        >
          <ArrowLeft size={13} />
          Kembali
        </button>
      </div>
    )
  }

  const handlePlayAll = () => {
    if (!playlist.songs.length) return
    setQueue(playlist.songs)
    setCurrent(playlist.songs[0])
    addHistory(playlist.songs[0])
  }

  const handleShuffle = () => {
    if (!playlist.songs.length) return
    const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5)
    setQueue(shuffled)
    setCurrent(shuffled[0])
    addHistory(shuffled[0])
  }

  const handlePlaySong = (song: any) => {
    if (current?.id === song.id) return
    setCurrent(song)
    addHistory(song)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
        onClick={() => router.push('/playlists')}
        className="mb-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 transition-all"
      >
        <ArrowLeft size={12} />
        Playlist
      </button>

      <div className="flex flex-col sm:flex-row gap-5 mb-8">
        <div className="relative w-full sm:w-40 aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-brand/30 to-brand-dark/30 shadow-2xl flex-none max-w-[200px] mx-auto sm:mx-0">
          {playlist.songs[0] ? (
            <Image
              src={playlist.songs[0].thumbnail}
              alt={playlist.name}
              fill
              sizes="200px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ListMusic size={48} className="text-white/40" />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-end text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-3 self-center sm:self-start">
            <ListMusic size={11} className="text-brand" />
            <span className="text-[10px] font-black tracking-wider uppercase text-white/60">
              Playlist
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black gradient-text mb-2">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-xs text-white/50 mb-2">{playlist.description}</p>
          )}
          <p className="text-xs text-white/40">{playlist.songs.length} lagu</p>

          {playlist.songs.length > 0 && (
            <div className="flex items-center gap-2 mt-5 justify-center sm:justify-start">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand to-brand-light text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-brand/30 hover:scale-105 active:scale-95 transition-all"
              >
                <PlayCircle size={16} />
                Putar Semua
              </button>
              <button
                onClick={handleShuffle}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-white/80 text-xs font-black uppercase tracking-wider hover:bg-white/10 active:scale-95 transition-all"
              >
                <Shuffle size={14} />
                Acak
              </button>
              <button
                onClick={() => {
                  if (confirm(`Hapus playlist "${playlist.name}"?`)) {
                    removePlaylist(playlist.id)
                    router.push('/playlists')
                  }
                }}
                className="w-10 h-10 rounded-xl glass text-red-400 hover:bg-red-500/10 flex items-center justify-center active:scale-95 transition-all"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {playlist.songs.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <Music2 size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-sm font-bold text-white/60">Playlist masih kosong</p>
          <p className="text-xs text-white/30 mt-1">
            Cari lagu dan tambahkan ke playlist ini
          </p>
        </div>
      )}

      <div className="space-y-2">
        {playlist.songs.map((song) => {
          const isCurrent = current?.id === song.id
          return (
            <div
              key={song.id}
              className={clsx(
                'glass rounded-2xl p-3 flex items-center gap-3 transition-all group',
                isCurrent ? 'bg-brand/10 border-brand/30' : 'hover:bg-white/[0.06]'
              )}
            >
              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-none bg-white/5">
                <Image
                  src={song.thumbnail}
                  alt={song.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play size={16} fill="white" className="text-white" />
                </div>
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
                <p className="text-[11px] text-white/50 truncate mt-0.5">
                  {song.artist}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-white/40 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock size={9} /> {song.duration}
                  </span>
                  {song.views > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye size={9} /> {formatViews(song.views)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeSong(playlist.id, song.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all flex-none opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>

              <button
                onClick={() => handlePlaySong(song)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-light text-white flex items-center justify-center flex-none shadow-lg shadow-brand/40 hover:scale-110 active:scale-95 transition-all"
              >
                <Play size={15} fill="currentColor" className="ml-0.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
