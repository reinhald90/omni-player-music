'use client'

import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { useAudio } from '@/hooks/useAudio'
import { Play, Pause } from 'lucide-react'
import FullPlayer from './FullPlayer'

export default function GlobalPlayer() {
  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const toggle = usePlayerStore((s) => s.toggle)
  const openFull = usePlayerStore((s) => s.openFull)
  const fullMode = usePlayerStore((s) => s.fullMode)
  const { audio, status, errorMsg } = useAudio()

  if (!current) return null

  return (
    <>
      {fullMode && <FullPlayer audio={audio} status={status} errorMsg={errorMsg} />}

      {!fullMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pointer-events-none">
          <button
            onClick={openFull}
            className="w-full max-w-3xl mx-auto glass-strong rounded-2xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden flex items-center gap-3 p-2.5 text-left"
          >
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-none bg-white/5">
              <Image src={current.thumbnail} alt={current.title} fill sizes="48px" className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">{current.title}</div>
              <div className="text-[10px] text-white/50 truncate mt-0.5">
                {status === 'loading' ? 'Memuat…' : status === 'error' ? errorMsg || 'Error' : current.artist}
              </div>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation()
                toggle()
              }}
              className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center flex-none shadow-lg shadow-brand/40"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </div>
          </button>
        </div>
      )}
    </>
  )
}
