'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { generateFallbackLyrics } from '@/lib/lyrics'
import { clsx } from 'clsx'

export default function Lyrics() {
  const current = usePlayerStore((s) => s.current)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const lyrics = usePlayerStore((s) => s.lyrics)
  const lyricsDuration = usePlayerStore((s) => s.lyricsDuration)
  const setLyrics = usePlayerStore((s) => s.setLyrics)
  const setLyricsDuration = usePlayerStore((s) => s.setLyricsDuration)
  const [loading, setLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  // === FETCH LYRICS ===
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

        const lines = json?.data?.lyrics
        const ld = Number(json?.data?.lyricsDuration || 0)

        if (!Array.isArray(lines) || lines.length === 0) {
          setLyrics(
            generateFallbackLyrics(
              current.title,
              current.artist,
              current.durationSec || 0
            )
          )
          setLyricsDuration(0)
        } else {
          setLyrics(lines)
          setLyricsDuration(ld)
        }
      } catch (e) {
        if (cancelled) return
        setLyrics(
          generateFallbackLyrics(current.title, current.artist, current.durationSec || 0)
        )
        setLyricsDuration(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLyrics()
    return () => {
      cancelled = true
    }
  }, [current, setLyrics, setLyricsDuration])

  // === SCALE FACTOR ===
  // Kalau durasi lrclib beda jauh dengan durasi audio asli, kita scale
  // Contoh: lrclib 180s, audio 218s → scale = 218/180 = 1.21
  // Artinya setiap timestamp lirik dikali 1.21 biar match
  const scaleFactor = useMemo(() => {
    if (!duration || duration <= 0) return 1
    if (!lyricsDuration || lyricsDuration <= 0) return 1
    const diff = Math.abs(lyricsDuration - duration)
    // Kalau beda < 3 detik, gak perlu scale
    if (diff < 3) return 1
    // Kalau beda > 60 detik, kemungkinan lagu beda versi → tetap scale biar proporsional
    return duration / lyricsDuration
  }, [duration, lyricsDuration])

  // === ADJUSTED TIME ===
  // currentTime * scaleFactor = waktu di timeline lirik asli
  const adjustedTime = currentTime * scaleFactor

  // === ACTIVE INDEX ===
  const activeIdx = useMemo(() => {
    if (!lyrics.length) return -1
    let lo = 0
    let hi = lyrics.length - 1
    let res = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (lyrics[mid].time <= adjustedTime) {
        res = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return res
  }, [lyrics, adjustedTime])

  // === AUTO SCROLL ===
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
