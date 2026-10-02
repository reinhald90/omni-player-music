'use client'

import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { X, Play, Trash2, ListMusic, SkipForward } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  open: boolean
  onClose: () => void
}

export default function QueuePanel({ open, onClose }: Props) {
  const queue = usePlayerStore((s) => s.queue)
  const current = usePlayerStore((s) => s.current)
  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)
  const clearQueue = usePlayerStore((s) => s.clearQueue)

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — slide up */}
      <div className="fixed bottom-0 left-0 right-0 z-[71] animate-[slideUp_0.3s_ease]">
        <div className="max-w-3xl mx-auto bg-[#0e0e12] border-t border-white/10 rounded-t-3xl max-h-[75vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-none">
            <div className="flex items-center gap-2">
              <ListMusic size={18} className="text-brand" />
              <div>
                <h2 className="text-sm font-black">Antrian</h2>
                <p className="text-[10px] text-white/40">
                  {queue.length} lagu {queue.length === 0 && '· kosong'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 active:scale-90 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3">
            {queue.length === 0 ? (
              <div className="text-center py-12">
                <ListMusic size={40} className="mx-auto text-white/15 mb-3" />
                <p className="text-sm font-bold text-white/50">Antrian kosong</p>
                <p className="text-xs text-white/30 mt-1">
                  Tambah lagu dari halaman pencarian
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {queue.map((song, idx) => {
                  const isCurrent = current?.id === song.id
                  return (
                    <div
                      key={`${song.id}-${idx}`}
                      className={clsx(
                        'flex items-center gap-3 p-2 rounded-xl transition-all group',
                        isCurrent
                          ? 'bg-brand/15 border border-brand/30'
                          : 'hover:bg-white/[0.05]'
                      )}
                    >
                      <button
                        onClick={() => setCurrent(song)}
                        className="relative w-12 h-12 rounded-lg overflow-hidden flex-none bg-white/5"
                      >
                        <Image
                          src={song.thumbnail}
                          alt={song.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="flex gap-[2px] items-end h-3">
                              <span className="w-[2px] bg-brand animate-pulse" style={{ height: '60%' }} />
                              <span className="w-[2px] bg-brand animate-pulse" style={{ height: '100%', animationDelay: '0.2s' }} />
                              <span className="w-[2px] bg-brand animate-pulse" style={{ height: '40%', animationDelay: '0.4s' }} />
                            </div>
                          </div>
                        )}
                      </button>

                      <div className="flex-1 min-w-0" onClick={() => setCurrent(song)}>
                        <div
                          className={clsx(
                            'text-xs font-bold truncate',
                            isCurrent ? 'text-brand' : 'text-white'
                          )}
                        >
                          {song.title}
                        </div>
                        <div className="text-[10px] text-white/40 truncate mt-0.5">
                          {song.artist}
                        </div>
                      </div>

                      <button
                        onClick={() => setCurrent(song)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-brand hover:bg-brand/10 transition-all flex-none"
                        aria-label="Putar"
                      >
                        <Play size={13} fill="currentColor" />
                      </button>

                      <button
                        onClick={() => removeFromQueue(idx)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all flex-none opacity-0 group-hover:opacity-100"
                        aria-label="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {queue.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5 flex-none">
              <button
                onClick={() => clearQueue()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={12} />
                Bersihkan
              </button>
              <div className="flex-1" />
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
                {queue.length} lagu
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
