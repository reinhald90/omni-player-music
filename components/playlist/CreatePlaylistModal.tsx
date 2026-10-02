'use client'

import { useState, useEffect } from 'react'
import { X, ListMusic, Check } from 'lucide-react'
import { usePlaylistStore } from '@/store/playlistStore'

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (id: string) => void
}

export default function CreatePlaylistModal({ open, onClose, onCreated }: Props) {
  const create = usePlaylistStore((s) => s.create)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setDesc('')
    }
  }, [open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const id = create(name, desc)
    onCreated?.(id)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
        <form
          onSubmit={handleSubmit}
          className="glass-strong rounded-3xl p-6 w-full max-w-sm pointer-events-auto animate-[fadeIn_0.2s]"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center">
                <ListMusic size={16} className="text-brand" />
              </div>
              <div>
                <h2 className="text-sm font-black">Buat Playlist</h2>
                <p className="text-[10px] text-white/40">Kumpulkan lagu favoritmu</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black tracking-wider uppercase text-white/40 mb-2 block">
                Nama Playlist
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={40}
                placeholder="Contoh: DJ Santai, Belajar…"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-brand/50 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-black tracking-wider uppercase text-white/40 mb-2 block">
                Deskripsi <span className="text-white/20">(opsional)</span>
              </label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                maxLength={80}
                placeholder="Deskripsi singkat"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-brand/50 transition-colors text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-wider transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand to-brand-light text-white text-xs font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-brand/30 transition-all flex items-center justify-center gap-2"
            >
              <Check size={14} />
              Buat
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
