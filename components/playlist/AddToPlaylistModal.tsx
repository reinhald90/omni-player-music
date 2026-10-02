'use client'

import { useState } from 'react'
import { X, ListMusic, Plus, Check, Music2 } from 'lucide-react'
import { usePlaylistStore } from '@/store/playlistStore'
import type { Song } from '@/types'
import { clsx } from 'clsx'
import CreatePlaylistModal from './CreatePlaylistModal'

interface Props {
  song: Song | null
  open: boolean
  onClose: () => void
}

export default function AddToPlaylistModal({ song, open, onClose }: Props) {
  const playlists = usePlaylistStore((s) => s.playlists)
  const addSong = usePlaylistStore((s) => s.addSong)
  const [createOpen, setCreateOpen] = useState(false)
  const [addedId, setAddedId] = useState<string | null>(null)

  if (!open || !song) return null

  const handleAdd = (plId: string) => {
    addSong(plId, song)
    setAddedId(plId)
    setTimeout(() => setAddedId(null), 1200)
  }

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[81] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="glass-strong rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col animate-[slideUp_0.3s_ease] sm:animate-[fadeIn_0.2s]">
          <div className="flex items-center justify-between p-5 border-b border-white/5 flex-none">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center flex-none">
                <Plus size={16} className="text-brand" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black">Tambah ke Playlist</h2>
                <p className="text-[10px] text-white/40 truncate">{song.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 flex-none"
            >
              <X size={14} />
            </button>
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            className="mx-4 mt-4 flex items-center gap-3 p-3 rounded-xl bg-brand/10 border border-brand/30 hover:bg-brand/15 transition-all flex-none"
          >
            <div className="w-11 h-11 rounded-lg bg-brand/20 flex items-center justify-center flex-none">
              <Plus size={20} className="text-brand" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-brand">Buat Playlist Baru</div>
              <div className="text-[10px] text-white/40">Bikin koleksi baru</div>
            </div>
          </button>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {playlists.length === 0 ? (
              <div className="text-center py-8">
                <Music2 size={32} className="mx-auto text-white/15 mb-2" />
                <p className="text-xs text-white/40">Belum ada playlist</p>
                <p className="text-[10px] text-white/25 mt-1">
                  Klik tombol di atas untuk membuat
                </p>
              </div>
            ) : (
              playlists.map((pl) => {
                const alreadyIn = pl.songs.some((s) => s.id === song.id)
                const justAdded = addedId === pl.id
                const cover = pl.songs[0]?.thumbnail
                return (
                  <button
                    key={pl.id}
                    onClick={() => !alreadyIn && handleAdd(pl.id)}
                    disabled={alreadyIn}
                    className={clsx(
                      'w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left',
                      alreadyIn
                        ? 'bg-brand/10 border border-brand/30'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/5'
                    )}
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-none bg-white/5">
                      {cover ? (
                        <img src={cover} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand/30 to-brand-dark/30 flex items-center justify-center">
                          <ListMusic size={18} className="text-white/60" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{pl.name}</div>
                      <div className="text-[10px] text-white/40 truncate mt-0.5">
                        {pl.songs.length} lagu
                        {pl.description && ` · ${pl.description}`}
                      </div>
                    </div>
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-full flex items-center justify-center flex-none transition-all',
                        alreadyIn ? 'bg-brand text-white' : 'bg-white/5 text-white/40'
                      )}
                    >
                      {alreadyIn || justAdded ? (
                        <Check size={13} strokeWidth={3} />
                      ) : (
                        <Plus size={13} />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      <CreatePlaylistModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => handleAdd(id)}
      />
    </>
  )
}
