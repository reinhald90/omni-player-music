'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePlaylistStore } from '@/store/playlistStore'
import { ListMusic, Plus, MoreVertical, Trash2, Music2, X } from 'lucide-react'
import CreatePlaylistModal from '@/components/playlist/CreatePlaylistModal'

export default function PlaylistsPage() {
  const playlists = usePlaylistStore((s) => s.playlists)
  const remove = usePlaylistStore((s) => s.remove)
  const [createOpen, setCreateOpen] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-3">
            <ListMusic size={11} className="text-brand" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
              Playlist
            </span>
          </div>
          <h1 className="text-2xl font-black gradient-text">Koleksi Pribadimu</h1>
          <p className="text-xs text-white/40 mt-1">
            {playlists.length > 0 ? `${playlists.length} playlist` : 'Belum ada playlist'}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand to-brand-light text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-brand/30 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={14} />
          Buat
        </button>
      </div>

      {playlists.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <ListMusic size={40} className="mx-auto text-white/20 mb-4" />
          <p className="text-sm font-bold text-white/60">Belum ada playlist</p>
          <p className="text-xs text-white/30 mt-1 mb-5">
            Buat playlist pertama kamu sekarang!
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand/15 border border-brand/30 text-brand text-xs font-black uppercase tracking-wider hover:bg-brand/25 transition-all"
          >
            <Plus size={14} />
            Buat Playlist
          </button>
        </div>
      )}

      {playlists.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {playlists.map((pl) => {
            const cover = pl.songs[0]?.thumbnail
            const menuOpen = menuOpenId === pl.id
            return (
              <div key={pl.id} className="relative group">
                <Link
                  href={`/playlists/${pl.id}`}
                  className="block glass rounded-2xl overflow-hidden hover:bg-white/[0.06] transition-all"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-brand/20 to-brand-dark/20">
                    {cover ? (
                      <img
                        src={cover}
                        alt={pl.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 size={40} className="text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <div className="text-[10px] font-black text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full inline-block">
                        {pl.songs.length} lagu
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-black truncate">{pl.name}</h3>
                    {pl.description && (
                      <p className="text-[10px] text-white/40 truncate mt-0.5">
                        {pl.description}
                      </p>
                    )}
                  </div>
                </Link>

                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setMenuOpenId(menuOpen ? null : pl.id)
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition-all z-10"
                >
                  {menuOpen ? <X size={14} /> : <MoreVertical size={14} />}
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setMenuOpenId(null)} />
                    <div className="absolute top-11 right-2 z-30 w-36 py-1.5 rounded-xl glass-strong border border-white/10 shadow-2xl">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus playlist "${pl.name}"?`)) {
                            remove(pl.id)
                          }
                          setMenuOpenId(null)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 text-left"
                      >
                        <Trash2 size={13} />
                        Hapus
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <CreatePlaylistModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
