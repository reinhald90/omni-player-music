'use client'

import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { generateFallbackLyrics } from '@/lib/lyrics'
import { clsx } from 'clsx'

export default function Lyrics() {
  const current = usePlayerStore((s) => s.current)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const lyrics = usePlayerStore((s) => s.lyrics)
  const setLyrics = usePlayerStore((s) => s.setLyrics)
  const [loading, setLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  // Fetch lyrics saat lagu berubah
  useEffect(() => {
    if (!current) return
    let cancelled = false

    const fetchLyrics = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          title: current.title,
          artist: current.artist,
          duration: String(current.durationSec || 0),
        })
        const res = await fetch(`/api/lyrics?${params}`)
        const json = await res.json()
        if (cancelled) return

        let lines = json?.data?.lyrics
        if (!Array.isArray(lines) || lines.length === 0) {
          lines = generateFallbackLyrics(
            current.title,
            current.artist,
            current.durationSec || 0
          )
        }
        setLyrics(lines)
      } catch (e) {
        if (cancelled) return
        setLyrics(
          generateFallbackLyrics(current.title, current.artist, current.durationSec || 0)
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLyrics()
    return () => {
      cancelled = true
    }
  }, [current, setLyrics])

  // Binary search index lirik aktif
  const activeIdx = (() => {
    if (!lyrics.length) return -1
    let lo = 0
    let hi = lyrics.length - 1
    let res = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (lyrics[mid].time <= currentTime) {
        res = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return res
  })()

  // Auto-scroll ke baris aktif
  useEffect(() => {
    if (activeIdx < 0) return
    const el = lineRefs.current[activeIdx]
    const c = containerRef.current
    if (!el || !c) return
    const target = el.offsetTop - c.clientHeight / 2 + el.clientHeight / 2
    c.scrollTo({ top: target, behavior: 'smooth' })
  }, [activeIdx])

  if (loading && !lyrics.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/50">
        <div className="w-8 h-8 border-[3px] border-white/20 border-t-brand rounded-full animate-spin" />
        <span className="text-xs font-medium">Mencari lirik…</span>
      </div>
    )
  }

  if (!lyrics.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
        Lirik tidak tersedia
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto px-6 scroll-smooth
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
        [mask-image:linear-gradient(180deg,transparent_0%,#000_20%,#000_80%,transparent_100%)]
        [-webkit-mask-image:linear-gradient(180deg,transparent_0%,#000_20%,#000_80%,transparent_100%)]"
    >
      <div className="py-[35%] flex flex-col gap-4">
        {lyrics.map((line, i) => (
          <div
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el
            }}
            className={clsx(
              'transition-all duration-300 leading-snug',
              i === activeIdx
                ? 'text-white text-[15px] font-bold scale-[1.02]'
                : i < activeIdx
                  ? 'text-white/25 text-[13px] font-semibold'
                  : 'text-white/45 text-[13px] font-semibold'
            )}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  )
}
