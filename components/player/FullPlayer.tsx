'use client'

import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { formatTime } from '@/lib/formatter'
import Visualizer from './Visualizer'
import Lyrics from './Lyrics'
import QueuePanel from './QueuePanel'
import SleepTimerPanel from './SleepTimerPanel'
import ShareCardModal from '@/components/share/ShareCardModal'
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle,
  Heart, Volume2, VolumeX, Volume1, Mic2, Disc3,
  ListMusic, Moon, Download, Share2,
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
  const queue = usePlayerStore((s) => s.queue)
  const sleepEnd = usePlayerStore((s) => s.sleepEnd)
  const toggle = usePlayerStore((s) => s.toggle)
  const closeFull = usePlayerStore((s) => s.closeFull)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleLoop = usePlayerStore((s) => s.toggleLoop)
  const toggleMute = usePlayerStore((s) => s.toggleMute)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)

  const isFav = useFavoritesStore((s) => (current ? s.isFavorite(current.id) : false))
  const toggleFav = useFavoritesStore((s) => s.toggle)

  const barRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  const [showLyrics, setShowLyrics] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const [timerOpen, setTimerOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [swipeY, setSwipeY] = useState(0)
  const swipeStart = useRef<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: any) => onSeekRelative(e.detail || 0)
    document.addEventListener('omni:seek', handler as EventListener)
    return () => document.removeEventListener('omni:seek', handler as EventListener)
  }, [onSeekRelative])

  const [sleepRemaining, setSleepRemaining] = useState(0)
  useEffect(() => {
    if (!sleepEnd) return setSleepRemaining(0)
    const tick = () =>
      setSleepRemaining(Math.max(0, Math.floor((sleepEnd - Date.now()) / 1000)))
    tick()
    const int = setInterval(tick, 1000)
    return () => clearInterval(int)
  }, [sleepEnd])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  if (!current) return null

  const displayTime = dragging ? dragTime : currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0
  const remaining = Math.max(0, duration - displayTime)
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

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
    onSeek(getTimeFromEvent(e.clientX))
    setDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  const onSwipeStart = (y: number) => {
    swipeStart.current = y
  }
  const onSwipeMove = (y: number) => {
    if (swipeStart.current == null) return
    const dy = y - swipeStart.current
    if (dy > 0) setSwipeY(dy)
  }
  const onSwipeEnd = () => {
    if (swipeY > 100) closeFull()
    setSwipeY(0)
    swipeStart.current = null
  }

  const handleDownload = async () => {
    try {
      showToast('Menyiapkan download…')
      const res = await fetch(
        `/api/stream?q=${encodeURIComponent(current.url || current.title)}`
      )
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Gagal ambil audio')

      const audioUrl = json.data.audioUrl
      const safeName = `${current.title.replace(/[^\w\s]/g, '').trim()}.mp3`

      const downloadUrl = `/api/audio?url=${encodeURIComponent(
        audioUrl
      )}&download=1&filename=${encodeURIComponent(safeName)}`

      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = safeName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      showToast('Download dimulai! 🎧')
    } catch (e: any) {
      showToast(e.message || 'Gagal download')
    }
  }

  const handleFavorite = () => {
    toggleFav(current)
    showToast(isFav ? 'Dihapus dari favorit' : 'Ditambah ke favorit ❤️')
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden transition-transform"
      style={{ transform: `translateY(${swipeY}px)` }}
      onTouchStart={(e) => onSwipeStart(e.touches[0].clientY)}
      onTouchMove={(e) => onSwipeMove(e.touches[0].clientY)}
      onTouchEnd={onSwipeEnd}
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src={current.thumbnail}
          alt=""
          fill
          sizes="100vw"
          className="object-cover scale-[2] blur-[140px] opacity-50 saturate-[1.8]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black/95" />
      </div>

      {toast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 text-xs font-bold animate-[fadeIn_0.2s] whitespace-nowrap">
          {toast}
        </div>
      )}

      <header className="flex items-center justify-between px-5 pt-5 pb-3 flex-none">
        <button
          onClick={closeFull}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.07] backdrop-blur-xl border border-white/10 text-white/90 hover:bg-white/15 transition-all active:scale-90"
        >
          <ChevronDown size={20} />
        </button>

        <div className="text-center flex-1 min-w-0 px-3">
          <div className="text-[10px] font-semibold tracking-[0.25em] uppercase text-white/40">
            {sleepEnd
              ? `⏱️ ${Math.floor(sleepRemaining / 60)}:${String(sleepRemaining % 60).padStart(2, '0')}`
              : showLyrics
                ? 'Lirik'
                : 'Sedang Diputar'}
          </div>
          <div className="text-[11px] text-white/60 mt-0.5 truncate font-medium">
            {current.artist}
          </div>
        </div>

        <button
          onClick={handleFavorite}
          className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90',
            isFav
              ? 'bg-brand/20 backdrop-blur-xl border border-brand/40 text-brand'
              : 'bg-white/[0.07] backdrop-blur-xl border border-white/10 text-white/90 hover:bg-white/15'
          )}
          aria-label="Favorit"
        >
          <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 min-h-0 gap-4">
        <button
          onClick={() => setShowLyrics((v) => !v)}
          className="relative w-full max-w-[320px] aspect-square rounded-[28px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.95),0_20px_40px_-15px_rgba(255,45,85,0.15)] ring-1 ring-white/5 active:scale-[0.98] transition-transform"
        >
          {showLyrics ? (
            <div className="w-full h-full bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-xl">
              <Lyrics />
            </div>
          ) : (
            <>
              <Image
                src={current.thumbnail}
                alt={current.title}
                fill
                sizes="(max-width: 768px) 90vw, 400px"
                className="object-cover"
                priority
              />
              {status === 'loading' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-12 h-12 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </>
          )}
        </button>

        <div className="flex items-center justify-between w-full max-w-[320px] px-1">
          <button
            onClick={() => setShowLyrics(false)}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all',
              !showLyrics ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40 hover:text-white/70'
            )}
          >
            <Disc3 size={11} />
            Cover
          </button>
          <button
            onClick={() => setShowLyrics(true)}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all',
              showLyrics ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40 hover:text-white/70'
            )}
          >
            <Mic2 size={11} />
            Lirik
          </button>
        </div>

        {!showLyrics && (
          <div className="w-full max-w-[320px]">
            <Visualizer variant="full" />
          </div>
        )}
      </div>

      <div className="flex-none px-6 pb-8 space-y-5">
        <div className="text-center px-2">
          <h2 className="text-[20px] leading-tight font-bold text-white truncate">
            {current.title}
          </h2>
          <p className="text-[14px] text-white/45 truncate mt-1 font-medium">
            {current.artist}
          </p>
          {status === 'error' && errorMsg && (
            <p className="text-xs text-red-400 mt-2 font-medium">{errorMsg}</p>
          )}
        </div>

        <div className="px-1">
          <div
            ref={barRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="relative h-5 flex items-center cursor-pointer select-none touch-none group"
          >
            <div className="relative w-full h-[3px] rounded-full bg-white/15 overflow-visible">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white"
                style={{ width: `${progress}%` }}
              />
              <div
                className={clsx(
                  'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.6)] transition-opacity',
                  dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
                style={{ left: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-white/40 font-medium tabular-nums mt-1">
            <span>{formatTime(displayTime)}</span>
            <span>-{formatTime(remaining)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-8">
          <button
            onClick={() => setQueueOpen(true)}
            className="relative text-white/40 hover:text-white/70 transition-colors p-1"
          >
            <ListMusic size={18} />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand text-[9px] font-black flex items-center justify-center">
                {queue.length > 9 ? '9+' : queue.length}
              </span>
            )}
          </button>

          <button
            onClick={prev}
            className="text-white/90 hover:text-white transition-colors p-1 active:scale-90"
          >
            <SkipBack size={26} fill="currentColor" />
          </button>

          <button
            onClick={toggle}
            disabled={status === 'loading'}
            className="w-[68px] h-[68px] rounded-full bg-white text-black flex items-center justify-center shadow-[0_16px_40px_-8px_rgba(255,255,255,0.35),0_8px_20px_-6px_rgba(0,0,0,0.5)] hover:scale-[1.04] active:scale-95 transition-transform disabled:opacity-60"
          >
            {status === 'loading' ? (
              <div className="w-6 h-6 border-[3px] border-black/20 border-t-black rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" className="ml-1" />
            )}
          </button>

          <button
            onClick={next}
            className="text-white/90 hover:text-white transition-colors p-1 active:scale-90"
          >
            <SkipForward size={26} fill="currentColor" />
          </button>

          <button
            onClick={toggleLoop}
            className={clsx(
              'transition-colors p-1',
              loop ? 'text-brand' : 'text-white/40 hover:text-white/70'
            )}
          >
            <Repeat size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={() => setTimerOpen(true)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95',
              sleepEnd
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
            )}
          >
            <Moon size={11} />
            Timer
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
          >
            <Download size={11} />
            Simpan
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
          >
            <Share2 size={11} />
            Bagikan
          </button>
        </div>

        <div className="flex items-center gap-3 pt-1 px-1">
          <button
            onClick={toggleMute}
            className="text-white/35 hover:text-white/70 transition-colors flex-none"
          >
            <VolumeIcon size={16} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-[3px] bg-white/15 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,0,0,0.5)]"
          />
          <Volume2 size={16} className="text-white/35 flex-none" />
        </div>
      </div>

      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
      <SleepTimerPanel open={timerOpen} onClose={() => setTimerOpen(false)} />
      <ShareCardModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  )
}
