'use client'

import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { useAudio } from '@/hooks/useAudio'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Play, Pause, SkipBack, SkipForward, Maximize2, Volume2, VolumeX } from 'lucide-react'
import FullPlayer from './FullPlayer'

export default function GlobalPlayer() {
  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const toggle = usePlayerStore((s) => s.toggle)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const openFull = usePlayerStore((s) => s.openFull)
  const fullMode = usePlayerStore((s) => s.fullMode)
  const toggleMute = usePlayerStore((s) => s.toggleMute)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const hideMiniPlayer = usePlayerStore((s) => s.hideMiniPlayer)

  const { status, errorMsg, seek, seekRelative } = useAudio()
  useKeyboardShortcuts()

  if (!current || hideMiniPlayer) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const VolumeIcon = muted || volume === 0 ? VolumeX : Volume2

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const t = (px / rect.width) * duration
    seek(t)
  }

  return (
    <>
      {fullMode && (
        <FullPlayer status={status} errorMsg={errorMsg} onSeek={seek} onSeekRelative={seekRelative} />
      )}

      {!fullMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
          <div className="w-full h-[2px] bg-white/10 pointer-events-auto cursor-pointer" onClick={handleProgressClick}>
            <div className="h-full bg-gradient-to-r from-brand via-brand-light to-brand-dark shadow-[0_0_12px_rgba(255,45,85,0.7)] transition-[width] duration-150" style={{ width: `${progress}%` }} />
          </div>

          <div className="bg-[#0a0a0e]/95 backdrop-blur-2xl border-t border-white/5 pointer-events-auto shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.8)]">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-3">
              <button onClick={openFull} className="flex items-center gap-3 flex-1 min-w-0 group text-left">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-none bg-white/5 shadow-lg ring-1 ring-white/5">
                  <Image src={current.thumbnail} alt={current.title} fill sizes="56px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold truncate">{current.title}</div>
                  <div className="text-[10px] sm:text-[11px] text-white/50 truncate mt-0.5">{status === 'loading' ? 'Memuat…' : status === 'error' ? errorMsg || 'Error' : current.artist}</div>
                </div>
              </button>

              <div className="flex items-center gap-1 sm:gap-2 flex-none">
                <div className="hidden md:flex items-center gap-2 mr-2">
                  <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors flex-none"><VolumeIcon size={16} /></button>
                  <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 h-[3px] bg-white/15 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
                </div>
                <button onClick={prev} className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 active:scale-90 transition-all"><SkipBack size={18} fill="currentColor" /></button>
                <button onClick={toggle} className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg shadow-white/20 hover:scale-105 active:scale-95 transition-transform">
                  {status === 'loading' ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>
                <button onClick={next} className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 active:scale-90 transition-all"><SkipForward size={18} fill="currentColor" /></button>
                <button onClick={openFull} className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 active:scale-90 transition-all"><Maximize2 size={15} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
