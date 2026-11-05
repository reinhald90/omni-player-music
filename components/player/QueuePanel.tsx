'use client'

import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { X, Play, Trash2, ListMusic } from 'lucide-react'
import { clsx } from 'clsx'

interface Props { open: boolean; onClose: () => void }

export default function QueuePanel({ open, onClose }: Props) {
  const queue = usePlayerStore((s) => s.queue)
  const current = usePlayerStore((s) => s.current)
  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)
  const clearQueue = usePlayerStore((s) => s.clearQueue)

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/80" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[71] animate-[slideUp_0.3s_ease]">
        <div className="max-w-3xl mx-auto bg-[#121212] border-t border-white/10 rounded-t-3xl max-h-[75vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-none">
            <div className="flex items-center gap-2">
              <ListMusic size={18} className="text-white" />
              <div><h2 className="text-sm font-black text-white">Antrian</h2><p className="text-[10px] text-white/40">{queue.length} lagu</p></div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"><X size={16} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {queue.length === 0 ? (
              <div className="text-center py-12"><ListMusic size={40} className="mx-auto text-white/20 mb-3" /><p className="text-sm font-bold text-white/50">Antrian kosong</p></div>
            ) : (
              <div className="space-y-1">
                {queue.map((song, idx) => {
                  const isCurrent = current?.id === song.id
                  return (
                    <div key={`${song.id}-${idx}`} className={clsx('flex items-center gap-3 p-2 rounded-lg transition-all group', isCurrent ? 'bg-white/10' : 'hover:bg-white/5')}>
                      <button onClick={() => setCurrent(song)} className="relative w-10 h-10 rounded-md overflow-hidden flex-none bg-[#1a1a1a]">
                        <Image src={song.thumbnail} alt={song.title} fill sizes="40px" className="object-cover" />
                      </button>
                      <div className="flex-1 min-w-0" onClick={() => setCurrent(song)}>
                        <div className={clsx('text-xs font-bold truncate', isCurrent ? 'text-white' : 'text-white/80')}>{song.title}</div>
                        <div className="text-[10px] text-white/40 truncate mt-0.5">{song.artist}</div>
                      </div>
                      <button onClick={() => removeFromQueue(idx)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13} /></button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {queue.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5 flex-none">
              <button onClick={() => clearQueue()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-xs font-bold text-red-400 hover:bg-red-500/10"><Trash2 size={12} /> Bersihkan</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
