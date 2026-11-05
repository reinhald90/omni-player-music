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
      {fullMode && <FullPlayer status={status} errorMsg={errorMsg} onSeek={seek} onSeekRelative={seekRelative} />}

      {!fullMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
          <div className="w-full h-[2px] bg-white/10 pointer-events-auto cursor-pointer" onClick={handleProgressClick}>
            <div className="h-full bg-white transition-[width] duration-150" style={{ width: `${progress}%` }} />
          </div>

          <div className="bg-[#0a0a0a] border-t border-white/5 pointer-events-auto shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
              <button onClick={openFull} className="flex items-center gap-3 flex-1 min-w-0 group text-left">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-none bg-[#1a1a1a]">
                  <Image src={current.thumbnail} alt={current.title} fill sizes="48px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate text-white">{current.title}</div>
                  <div className="text-[11px] text-white/50 truncate mt-0.5">{status === 'loading' ? 'Memuat…' : current.artist}</div>
                </div>
              </button>

              <div className="flex items-center gap-2 flex-none">
                <div className="hidden md:flex items-center gap-2 mr-4">
                  <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors"><VolumeIcon size={16} /></button>
                  <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
                </div>
                <button onClick={prev} className="p-2 text-white/70 hover:text-white transition-all"><SkipBack size={20} fill="currentColor" /></button>
                <button onClick={toggle} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                  {status === 'loading' ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>
                <button onClick={next} className="p-2 text-white/70 hover:text-white transition-all"><SkipForward size={20} fill="currentColor" /></button>
                <button onClick={openFull} className="p-2 text-white/50 hover:text-white transition-all ml-2"><Maximize2 size={18} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
