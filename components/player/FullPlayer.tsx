'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { formatTime } from '@/lib/formatter'
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
} from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  status: 'idle' | 'loading' | 'ready' | 'error'
  errorMsg: string | null
  onSeek: (time: number) => void
  onSeekRelative: (delta: number) => void
}

export default function FullPlayer({ status, errorMsg, onSeek, onSeekRelative }: Props) {
  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const loop = usePlayerStore((s) => s.loop)
  const toggle = usePlayerStore((s) => s.toggle)
  const closeFull = usePlayerStore((s) => s.closeFull)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleLoop = usePlayerStore((s) => s.toggleLoop)

  const barRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)

  if (!current) return null

  const progress = duration > 0 ? ((dragging ? dragTime : currentTime) / duration) * 100 : 0

  const getTimeFromEvent = (clientX: number) => {
    if (!barRef.current || !duration) return 0
    const rect = barRef.current.getBoundingClientRect()
    const px = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return (px / rect.width) * duration
  }

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true)
    setDragTime(getTimeFromEvent(e.clientX))
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    setDragTime(getTimeFromEvent(e.clientX))
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return
    const t = getTimeFromEvent(e.clientX)
    onSeek(t)
    setDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={current.thumbnail}
          alt=""
          fill
          sizes="100vw"
          className="object-cover scale-150 blur-[120px] opacity-40 saturate-200"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          onClick={closeFull}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
          aria-label="Close"
        >
          <ChevronDown size={20} />
        </button>
        <div className="text-center flex-1 min-w-0">
          <div className="text-[9px] font-black tracking-[0.3em] uppercase text-brand">
            ● Now Playing
          </div>
          <div className="text-[10px] text-white/50 mt-1 truncate">{current.artist}</div>
        </div>
        <div className="w-10 h-10" />
      </div>

      {/* Cover */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4 min-h-0">
        <div className="relative w-full aspect-square max-w-md mx-auto rounded-3xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(255,45,85,0.4),0_20px_40px_-10px_rgba(0,0,0,0.9)]">
          <Image
            src={current.thumbnail}
            alt={current.title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
            priority
          />
          {status === 'loading' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <div className="w-12 h-12 border-4 border-white/20 border-t-brand rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Info + Controls */}
      <div className="px-6 pb-8 space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-black truncate px-4">{current.title}</h2>
          <p className="text-sm text-white/50 truncate mt-1.5">{current.artist}</p>
          {status === 'error' && errorMsg && (
            <p className="text-xs text-red-400 mt-2">{errorMsg}</p>
          )}
        </div>

        {/* Progress */}
        <div>
          <div
            ref={barRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="relative h-5 flex items-center cursor-pointer select-none touch-none"
          >
            <div className="relative w-full h-1 rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand via-brand-light to-brand-dark shadow-[0_0_12px_rgba(255,45,85,0.6)]"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,45,85,0.9)]"
                style={{ left: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-white/40 font-semibold tabular-nums mt-1">
            <span>{formatTime(dragging ? dragTime : currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button className="p-2 text-white/40 hover:text-white transition" aria-label="Shuffle">
            <Shuffle size={20} />
          </button>
          <button
            onClick={() => onSeekRelative(-10)}
            className="p-2 text-white/70 hover:text-white transition"
            aria-label="Rewind"
          >
            <SkipBack size={24} />
          </button>
          <button
            onClick={toggle}
            disabled={status === 'loading'}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_15px_40px_-10px_rgba(255,45,85,0.7)] hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {status === 'loading' ? (
              <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={26} fill="currentColor" />
            ) : (
              <Play size={26} fill="currentColor" className="ml-1" />
            )}
          </button>
          <button
            onClick={() => onSeekRelative(10)}
            className="p-2 text-white/70 hover:text-white transition"
            aria-label="Forward"
          >
            <SkipForward size={24} />
          </button>
          <button
            onClick={toggleLoop}
            className={clsx('p-2 transition', loop ? 'text-brand' : 'text-white/40 hover:text-white')}
            aria-label="Loop"
          >
            <Repeat size={20} />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 pt-1">
          <Volume2 size={16} className="text-white/40 flex-none" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,45,85,0.9)]"
          />
        </div>
      </div>
    </div>
  )
}
