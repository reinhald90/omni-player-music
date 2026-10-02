'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react'

export default function VolumeSlider() {
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleMute = usePlayerStore((s) => s.toggleMute)

  const effectiveVolume = muted ? 0 : volume

  const Icon =
    effectiveVolume === 0
      ? VolumeX
      : effectiveVolume < 0.33
        ? Volume
        : effectiveVolume < 0.66
          ? Volume1
          : Volume2

  return (
    <div className="flex items-center gap-2 flex-1 max-w-[200px]">
      <button
        onClick={toggleMute}
        className="text-white/50 hover:text-white transition-colors flex-none"
        aria-label="Mute"
      >
        <Icon size={16} />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={effectiveVolume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-brand bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,45,85,0.75)]"
      />
    </div>
  )
}
