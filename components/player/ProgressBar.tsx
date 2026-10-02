'use client'

import { useRef, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { formatTime } from '@/lib/formatter'

interface Props {
  onSeek: (time: number) => void
}

export default function ProgressBar({ onSeek }: Props) {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const barRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)

  const displayTime = dragging ? dragTime : currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0

  const getTimeFromEvent = (clientX: number) => {
    if (!barRef.current || !duration) return 0
    const rect = barRef.current.getBoundingClientRect()
    const px = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return (px / rect.width) * duration
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true)
    setDragTime(getTimeFromEvent(e.clientX))
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    setDragTime(getTimeFromEvent(e.clientX))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragging) return
    const t = getTimeFromEvent(e.clientX)
    onSeek(t)
    setDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  return (
    <div className="w-full">
      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative h-4 flex items-center cursor-pointer select-none touch-none group"
      >
        <div className="relative w-full h-1 rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand via-brand-light to-brand-dark shadow-[0_0_12px_rgba(255,45,85,0.55)]"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_12px_rgba(255,45,85,0.9)] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, opacity: dragging ? 1 : undefined }}
          />
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-white/40 font-semibold tabular-nums mt-1 px-0.5">
        <span>{formatTime(displayTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}
