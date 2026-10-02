'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Play, Pause, SkipBack, SkipForward, Repeat } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  onSeekRelative: (delta: number) => void
}

export default function Controls({ onSeekRelative }: Props) {
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const toggle = usePlayerStore((s) => s.toggle)
  const loop = usePlayerStore((s) => s.loop)
  const toggleLoop = usePlayerStore((s) => s.toggleLoop)

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      <button
        onClick={() => onSeekRelative(-10)}
        className="text-white/60 hover:text-white transition-colors p-2"
        aria-label="Rewind 10s"
      >
        <SkipBack size={20} />
      </button>

      <button
        onClick={toggle}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-white to-gray-200 text-black flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(255,45,85,0.55),0_8px_20px_-6px_rgba(0,0,0,0.6)] hover:scale-105 active:scale-95 transition-transform"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause size={22} fill="currentColor" />
        ) : (
          <Play size={22} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <button
        onClick={() => onSeekRelative(10)}
        className="text-white/60 hover:text-white transition-colors p-2"
        aria-label="Forward 10s"
      >
        <SkipForward size={20} />
      </button>

      <button
        onClick={toggleLoop}
        className={clsx(
          'p-2 transition-colors',
          loop ? 'text-brand' : 'text-white/60 hover:text-white'
        )}
        aria-label="Toggle loop"
      >
        <Repeat size={18} />
      </button>
    </div>
  )
}
