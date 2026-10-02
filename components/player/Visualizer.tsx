'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/playerStore'

const BAR_COUNT = 32

export default function Visualizer() {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const phaseRef = useRef(0)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  useEffect(() => {
    if (!isPlaying) {
      // Reset bars
      barsRef.current.forEach((b) => {
        if (b) b.style.height = '4px'
      })
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }

    const animate = () => {
      phaseRef.current += 0.15
      barsRef.current.forEach((b, i) => {
        if (!b) return
        const v = Math.sin(phaseRef.current + i * 0.4) * 0.5 + 0.5
        const h = 6 + v * 90 * (0.5 + Math.random() * 0.5)
        b.style.height = h.toFixed(1) + 'px'
      })
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying])

  return (
    <div className="absolute inset-x-0 bottom-0 h-12 flex items-end justify-center gap-[2px] px-4 pb-2 pointer-events-none opacity-90">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            barsRef.current[i] = el
          }}
          className="block w-[3px] max-w-[3px] min-w-[2px] rounded-sm bg-gradient-to-t from-brand via-brand-light to-white shadow-[0_0_6px_rgba(255,45,85,0.5)] transition-[height] duration-75"
          style={{ height: '4px' }}
        />
      ))}
    </div>
  )
}
