'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  onClose: () => void
}

export default function KaraokeMode({ onClose }: Props) {
  const current = usePlayerStore((s) => s.current)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const lyrics = usePlayerStore((s) => s.lyrics)
  const lyricsDuration = usePlayerStore((s) => s.lyricsDuration)
  const lyricsOffset = usePlayerStore((s) => s.lyricsOffset)
  const duration = usePlayerStore((s) => s.duration)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const [userScrolled, setUserScrolled] = useState(false)
  const lastScrollTime = useRef<number>(0)

  const scaleFactor = useMemo(() => {
    if (!duration || duration <= 0) return 1
    if (!lyricsDuration || lyricsDuration <= 0) return 1
    const diff = Math.abs(lyricsDuration - duration)
    if (diff < 3) return 1
    return duration / lyricsDuration
  }, [duration, lyricsDuration])

  const adjustedTime = currentTime * scaleFactor - lyricsOffset

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

  // Progress baris aktif
  const lineProgress = useMemo(() => {
    if (activeIdx < 0 || activeIdx >= lyrics.length - 1) return 0
    const start = lyrics[activeIdx].time
    const end = lyrics[activeIdx + 1].time
    const span = end - start
    if (span <= 0) return 0
    return Math.max(0, Math.min(1, (adjustedTime - start) / span))
  }, [activeIdx, adjustedTime, lyrics])

  // Auto-scroll
  useEffect(() => {
    if (userScrolled) return
    if (activeIdx < 0) return
    const el = lineRefs.current[activeIdx]
    const c = containerRef.current
    if (!el || !c) return
    const target = el.offsetTop - c.clientHeight / 2 + el.clientHeight / 2
    c.scrollTo({ top: target, behavior: 'smooth' })
  }, [activeIdx, userScrolled])

  // Detect user scroll
  const handleScroll = () => {
    const now = Date.now()
    if (now - lastScrollTime.current > 150) {
      setUserScrolled(true)
      setTimeout(() => setUserScrolled(false), 3000)
    }
    lastScrollTime.current = now
  }

  if (!current) return null

  return (
    <div className="fixed inset-0 z-[90] flex flex-col animate-[fadeIn_0.3s]">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-black">
        <img
          src={current.thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-[2] blur-[140px] opacity-30 saturate-[1.5]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-none">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.07] backdrop-blur-xl border border-white/10 text-white/90 active:scale-90 transition-all"
        >
          <ChevronDown size={20} />
        </button>
        <div className="text-center flex-1">
          <div className="text-[10px] font-black tracking-[0.3em] uppercase text-brand">
            🎤 Karaoke Mode
          </div>
          <div className="text-[10px] text-white/40 mt-0.5 truncate">
            {current.title}
          </div>
        </div>
        <div className="w-10 h-10" />
      </div>

      {/* Lyrics */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
          [mask-image:linear-gradient(180deg,transparent_0%,#000_18%,#000_82%,transparent_100%)]
          [-webkit-mask-image:linear-gradient(180deg,transparent_0%,#000_18%,#000_82%,transparent_100%)]"
      >
        <div className="py-[45%] flex flex-col gap-6">
          {lyrics.map((line, i) => {
            const isActive = i === activeIdx
            const isPassed = i < activeIdx
            return (
              <div
                key={i}
                ref={(el) => {
                  lineRefs.current[i] = el
                }}
                className={clsx(
                  'relative leading-tight transition-all duration-500 text-center',
                  isActive
                    ? 'text-white text-2xl sm:text-3xl font-black scale-105'
                    : isPassed
                      ? 'text-white/20 text-lg sm:text-xl font-bold'
                      : 'text-white/40 text-lg sm:text-xl font-bold'
                )}
                style={
                  isActive
                    ? {
                        textShadow:
                          '0 0 30px rgba(255,45,85,0.5), 0 0 60px rgba(255,45,85,0.3)',
                      }
                    : {}
                }
              >
                {isActive ? (
                  <span className="relative inline-block">
                    {/* Base text */}
                    <span className="text-white/25">{line.text}</span>
                    {/* Filled text overlay dengan gradient */}
                    <span
                      className="absolute left-0 top-0 gradient-text whitespace-nowrap overflow-hidden"
                      style={{ width: `${lineProgress * 100}%` }}
                    >
                      {line.text}
                    </span>
                  </span>
                ) : (
                  line.text
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
