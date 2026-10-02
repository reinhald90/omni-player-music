'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { getFrequencyData, isAnalyserReady } from '@/lib/audioAnalyser'
import { clsx } from 'clsx'

const FULL_BARS = 48
const MINI_BARS = 10

interface Props {
  variant?: 'full' | 'mini'
  className?: string
}

export default function Visualizer({ variant = 'full', className }: Props) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const phaseRef = useRef(0)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const barCount = variant === 'full' ? FULL_BARS : MINI_BARS

  useEffect(() => {
    if (!isPlaying) {
      barsRef.current.forEach((b) => {
        if (b) b.style.height = variant === 'full' ? '4%' : '15%'
      })
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }

    const animate = () => {
      const freq = isAnalyserReady() ? getFrequencyData() : null

      if (freq && freq.length > 0) {
        // === REAL VISUALIZER ===
        // 128 fftSize → 64 bins. Ambil dari low-mid range (bins 1-48).
        for (let i = 0; i < barsRef.current.length; i++) {
          const b = barsRef.current[i]
          if (!b) continue

          // Map bar index ke bin frekuensi (skip DC & high-freq)
          const binStart = 1
          const binEnd = Math.min(freq.length - 1, 50)
          const binIdx = binStart + Math.floor((i / barsRef.current.length) * (binEnd - binStart))

          // Ambil nilai (0-255) → normalisasi
          let v = freq[binIdx] / 255
          // Boost visual dengan curve non-linear
          v = Math.pow(v, 0.75)
          // Scale ke tinggi (min 8%, max 100%)
          const h = 8 + v * 92

          b.style.height = h.toFixed(1) + '%'
        }
      } else {
        // === FALLBACK: FAKE SINE WAVE ===
        phaseRef.current += 0.15
        for (let i = 0; i < barsRef.current.length; i++) {
          const b = barsRef.current[i]
          if (!b) continue
          const w1 = Math.sin(phaseRef.current + i * 0.4)
          const w2 = Math.sin(phaseRef.current * 1.7 + i * 0.9) * 0.5
          const w3 = Math.sin(phaseRef.current * 0.5 + i * 1.2) * 0.3
          const v = (w1 + w2 + w3) / 1.8
          const h = 20 + ((v + 1) / 2) * 75
          b.style.height = h.toFixed(1) + '%'
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, variant])

  return (
    <div
      className={clsx(
        'flex items-end justify-center',
        variant === 'full' ? 'h-16 px-6 gap-[2px]' : 'h-3 px-1 gap-[2px]',
        className
      )}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            barsRef.current[i] = el
          }}
          className={clsx(
            'rounded-full transition-[height] duration-75 ease-out',
            variant === 'full'
              ? 'w-[3px] bg-gradient-to-t from-brand/40 via-brand-light to-white shadow-[0_0_8px_rgba(255,45,85,0.4)]'
              : 'w-[2px] bg-white/70'
          )}
          style={{ height: variant === 'full' ? '4%' : '15%' }}
        />
      ))}
    </div>
  )
}
