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
import KaraokeMode from './KaraokeMode'
import EqualizerPanel from './EqualizerPanel'
import ShareCardModal from '@/components/share/ShareCardModal'
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Heart, Volume2, VolumeX, Mic2, Disc3, ListMusic, Moon, Download, Share2, Mic, Sliders } from 'lucide-react'
import { clsx } from 'clsx'

interface Props { status: 'idle' | 'loading' | 'ready' | 'error'; errorMsg: string | null; onSeek: (time: number) => void; onSeekRelative: (delta: number) => void }

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
  const [karaokeOpen, setKaraokeOpen] = useState(false)
  const [eqOpen, setEqOpen] = useState(false)
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
    const tick = () => setSleepRemaining(Math.max(0, Math.floor((sleepEnd - Date.now()) / 1000)))
    tick(); const int = setInterval(tick, 1000); return () => clearInterval(int)
  }, [sleepEnd])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200) }

  if (!current) return null

  const displayTime = dragging ? dragTime : currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0
  const remaining = Math.max(0, duration - displayTime)
  const VolumeIcon = muted || volume === 0 ? VolumeX : Volume2

  const getTimeFromEvent = (clientX: number) => {
    if (!barRef.current || !duration) return 0
    const rect = barRef.current.getBoundingClientRect()
    const px = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return (px / rect.width) * duration
  }
  const onPointerDown = (e: React.PointerEvent) => { setDragging(true); setDragTime(getTimeFromEvent(e.clientX)); (e.target as HTMLElement).setPointerCapture(e.pointerId) }
  const onPointerMove = (e: React.PointerEvent) => { if (!dragging) return; setDragTime(getTimeFromEvent(e.clientX)) }
  const onPointerUp = (e: React.PointerEvent) => { if (!dragging) return; onSeek(getTimeFromEvent(e.clientX)); setDragging(false); (e.target as HTMLElement).releasePointerCapture(e.pointerId) }

  const onSwipeStart = (y: number) => { swipeStart.current = y }
  const onSwipeMove = (y: number) => { if (swipeStart.current == null) return; const dy = y - swipeStart.current; if (dy > 0) setSwipeY(dy) }
  const onSwipeEnd = () => { if (swipeY > 100) closeFull(); setSwipeY(0); swipeStart.current = null }

  const handleDownload = async () => {
    try {
      showToast('Menyiapkan download…')
      const res = await fetch(`/api/stream?q=${encodeURIComponent(current.url || current.title)}&api_key=web`, { headers: { 'x-opm-client': 'web' } })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      const a = document.createElement('a'); a.href = `/api/audio?url=${encodeURIComponent(json.data.audioUrl)}&download=1&filename=${encodeURIComponent(current.title + '.mp3')}`; a.click(); showToast('Download dimulai!')
    } catch (e: any) { showToast('Gagal download') }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#050505] transition-transform" style={{ transform: `translateY(${swipeY}px)` }}
      onTouchStart={(e) => onSwipeStart(e.touches[0].clientY)} onTouchMove={(e) => onSwipeMove(e.touches[0].clientY)} onTouchEnd={onSwipeEnd}>
      
      <div className="absolute inset-0 -z-10">
        <Image src={current.thumbnail} alt="" fill sizes="100vw" className="object-cover scale-[2] blur-[100px] opacity-20" />
        <div className="absolute inset-0 bg-black/80" />
      </div>

      {toast && <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white text-black text-xs font-bold animate-[fadeIn_0.2s]">{toast}</div>}

      <header className="flex items-center justify-between px-6 pt-6 pb-4 flex-none">
        <button onClick={closeFull} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"><ChevronDown size={22} /></button>
        <div className="text-center flex-1 min-w-0 px-3">
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">{sleepEnd ? `⏱️ ${Math.floor(sleepRemaining / 60)}:${String(sleepRemaining % 60).padStart(2, '0')}` : showLyrics ? 'Lirik' : 'Sedang Diputar'}</div>
          <div className="text-xs text-white/70 mt-1 truncate font-semibold">{current.artist}</div>
        </div>
        <button onClick={() => { toggleFav(current); showToast(isFav ? 'Dihapus' : 'Disukai') }} className={clsx('w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90', isFav ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20')}><Heart size={18} fill={isFav ? 'currentColor' : 'none'} /></button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 min-h-0 gap-6">
        <button onClick={() => setShowLyrics((v) => !v)} className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl active:scale-[0.98] transition-transform">
          {showLyrics ? <div className="w-full h-full bg-[#121212]"><Lyrics /></div> : (
            <><Image src={current.thumbnail} alt={current.title} fill sizes="(max-width: 768px) 90vw, 400px" className="object-cover" priority />
            {status === 'loading' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-10 h-10 border-[3px] border-white/20 border-t-white rounded-full animate-spin" /></div>}</>
          )}
        </button>

        <div className="flex items-center justify-between w-full max-w-[320px] px-1">
          <button onClick={() => setShowLyrics(false)} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all', !showLyrics ? 'bg-white text-black' : 'bg-white/5 text-white/50 hover:text-white')}><Disc3 size={12} /> Cover</button>
          <button onClick={() => setShowLyrics(true)} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all', showLyrics ? 'bg-white text-black' : 'bg-white/5 text-white/50 hover:text-white')}><Mic2 size={12} /> Lirik</button>
        </div>

        {!showLyrics && <div className="w-full max-w-[340px]"><Visualizer variant="full" height={100} /></div>}
      </div>

      <div className="flex-none px-6 pb-8 space-y-6">
        <div className="text-center px-2">
          <h2 className="text-xl font-bold text-white truncate">{current.title}</h2>
          {status === 'error' && errorMsg && <p className="text-xs text-red-400 mt-2">{errorMsg}</p>}
        </div>

        <div className="px-1">
          <div ref={barRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} className="relative h-5 flex items-center cursor-pointer select-none touch-none group">
            <div className="relative w-full h-1 rounded-full bg-white/20 overflow-visible">
              <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${progress}%` }} />
              <div className={clsx('absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white transition-opacity', dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} style={{ left: `${progress}%` }} />
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-white/40 font-semibold tabular-nums mt-1">
            <span>{formatTime(displayTime)}</span><span>-{formatTime(remaining)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-8">
          <button onClick={() => setQueueOpen(true)} className="relative text-white/40 hover:text-white p-1"><ListMusic size={20} />{queue.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center">{queue.length > 9 ? '9+' : queue.length}</span>}</button>
          <button onClick={prev} className="text-white hover:text-white/70 p-1 active:scale-90"><SkipBack size={28} fill="currentColor" /></button>
          <button onClick={toggle} disabled={status === 'loading'} className="w-[72px] h-[72px] rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-60">
            {status === 'loading' ? <div className="w-6 h-6 border-[3px] border-black/20 border-t-black rounded-full animate-spin" /> : isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
          </button>
          <button onClick={next} className="text-white hover:text-white/70 p-1 active:scale-90"><SkipForward size={28} fill="currentColor" /></button>
          <button onClick={toggleLoop} className={clsx('p-1', loop ? 'text-white' : 'text-white/40 hover:text-white')}><Repeat size={20} /></button>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          <button onClick={() => setTimerOpen(true)} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all', sleepEnd ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10')}><Moon size={12} /> Timer</button>
          <button onClick={() => setEqOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider"><Sliders size={12} /> EQ</button>
          <button onClick={() => setKaraokeOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider"><Mic size={12} /> Karaoke</button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider"><Download size={12} /> Simpan</button>
          <button onClick={() => setShareOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider"><Share2 size={12} /> Bagikan</button>
        </div>

        <div className="flex items-center gap-3 pt-2 px-1">
          <button onClick={toggleMute} className="text-white/40 hover:text-white flex-none"><VolumeIcon size={18} /></button>
          <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
          <Volume2 size={18} className="text-white/40 flex-none" />
        </div>
      </div>

      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
      <SleepTimerPanel open={timerOpen} onClose={() => setTimerOpen(false)} />
      <ShareCardModal open={shareOpen} onClose={() => setShareOpen(false)} />
      <EqualizerPanel open={eqOpen} onClose={() => setEqOpen(false)} />
      {karaokeOpen && <KaraokeMode onClose={() => setKaraokeOpen(false)} />}
    </div>
  )
}
