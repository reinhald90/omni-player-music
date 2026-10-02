'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { generateFallbackLyrics } from '@/lib/lyrics'
import { clsx } from 'clsx'
import { RotateCcw, Minus, Plus } from 'lucide-react'

export default function Lyrics() {
  const current = usePlayerStore((s) => s.current)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const lyrics = usePlayerStore((s) => s.lyrics)
  const lyricsDuration = usePlayerStore((s) => s.lyricsDuration)
  const lyricsOffset = usePlayerStore((s) => s.lyricsOffset)
  const setLyrics = usePlayerStore((s) => s.setLyrics)
  const setLyricsDuration = usePlayerStore((s) => s.setLyricsDuration)
  const setLyricsOffset = usePlayerStore((s) => s.setLyricsOffset)
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
  const scaleFactor = useMemo(() => {
    if (!duration || duration <= 0) return 1
    if (!lyricsDuration || lyricsDuration <= 0) return 1
    const diff = Math.abs(lyricsDuration - duration)
    if (diff < 3) return 1
    return duration / lyricsDuration
  }, [duration, lyricsDuration])

  // === ADJUSTED TIME — sekarang dengan offset juga ===
  // adjustedTime = currentTime * scale - offset
  // offset positif = lirik mundur (delay)
  // offset negatif = lirik maju (cepetin)
  const adjustedTime = currentTime * scaleFactor - lyricsOffset

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
    <div className="w-full h-full flex flex-col">
      {/* === SCROLL AREA === */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 scroll-smooth
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
          [mask-image:linear-gradient(180deg,transparent_0%,#000_15%,#000_85%,transparent_100%)]
          [-webkit-mask-image:linear-gradient(180deg,transparent_0%,#000_15%,#000_85%,transparent_100%)]"
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

      {/* === OFFSET CONTROL === */}
      <div className="flex-none px-3 pb-3 pt-1">
        <div className="glass-strong rounded-2xl p-2.5 flex items-center gap-2">
          <button
            onClick={() => setLyricsOffset(Math.max(-30, lyricsOffset - 0.5))}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 active:scale-90 transition-all flex-none"
            aria-label="Mundurkan lirik"
          >
            <Minus size={14} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-center mb-1">
              <span
                className={clsx(
                  'text-[10px] font-black tracking-wider tabular-nums',
                  Math.abs(lyricsOffset) < 0.05
                    ? 'text-white/40'
                    : lyricsOffset > 0
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                )}
              >
                {lyricsOffset > 0
                  ? `Lirik mundur ${lyricsOffset.toFixed(1)}s`
                  : lyricsOffset < 0
                    ? `Lirik maju ${Math.abs(lyricsOffset).toFixed(1)}s`
                    : 'Offset: 0.0s (pas)'}
              </span>
            </div>
            <input
              type="range"
              min={-15}
              max={15}
              step={0.1}
              value={lyricsOffset}
              onChange={(e) => setLyricsOffset(parseFloat(e.target.value))}
              className="w-full h-[3px] bg-white/15 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,0,0,0.5)]"
            />
          </div>

          <button
            onClick={() => setLyricsOffset(Math.min(30, lyricsOffset + 0.5))}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 active:scale-90 transition-all flex-none"
            aria-label="Percepat lirik"
          >
            <Plus size={14} />
          </button>

          <button
            onClick={() => setLyricsOffset(0)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 active:scale-90 transition-all flex-none"
            aria-label="Reset offset"
          >
            <RotateCcw size={13} />
          </button>
        </div>
        <p className="text-center text-[9px] text-white/30 mt-1.5 font-medium">
          Geser kalau lirik tidak pas
        </p>
      </div>
    </div>
  )
}
