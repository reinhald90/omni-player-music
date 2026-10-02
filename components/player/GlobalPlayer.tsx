'use client'

import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { useAudio } from '@/hooks/useAudio'
import Visualizer from './Visualizer'
import ProgressBar from './ProgressBar'
import Controls from './Controls'
import VolumeSlider from './VolumeSlider'
import { useHistoryStore } from '@/store/historyStore'

export default function GlobalPlayer() {
  const current = usePlayerStore((s) => s.current)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const { audio } = useAudio()
  const addHistory = useHistoryStore((s) => s.add)

  const handleSeek = (time: number) => {
    if (audio) {
      audio.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleSeekRelative = (delta: number) => {
    if (!audio) return
    const newTime = Math.max(0, Math.min((audio.duration || 0), audio.currentTime + delta))
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  if (!current) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pointer-events-none">
      <div className="max-w-3xl mx-auto glass-strong rounded-2xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden">
        <div className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            {/* Thumbnail + Visualizer */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-none bg-white/5">
              <Image
                src={current.thumbnail}
                alt={current.title}
                fill
                sizes="64px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Visualizer />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold truncate leading-tight">{current.title}</h3>
              <p className="text-xs text-white/50 truncate mt-0.5">{current.artist}</p>
            </div>

            {/* Volume (desktop) */}
            <div className="hidden sm:flex">
              <VolumeSlider />
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <ProgressBar onSeek={handleSeek} />
          </div>

          {/* Controls */}
          <div className="mt-1">
            <Controls onSeekRelative={handleSeekRelative} />
          </div>
        </div>
      </div>
    </div>
  )
}
