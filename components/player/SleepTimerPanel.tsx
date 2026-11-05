'use client'

import { usePlayerStore } from '@/store/playerStore'
import { X, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props { open: boolean; onClose: () => void }
const OPTIONS = [{ min: 5, label: '5 menit' }, { min: 15, label: '15 menit' }, { min: 30, label: '30 menit' }, { min: 60, label: '1 jam' }]

export default function SleepTimerPanel({ open, onClose }: Props) {
  const sleepEnd = usePlayerStore((s) => s.sleepEnd)
  const startSleep = usePlayerStore((s) => s.startSleep)
  const cancelSleep = usePlayerStore((s) => s.cancelSleep)
  const pause = usePlayerStore((s) => s.pause)

  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!sleepEnd) { setRemaining(0); return }
    const tick = () => { const r = Math.max(0, Math.floor((sleepEnd - Date.now()) / 1000)); setRemaining(r); if (r === 0) { pause(); cancelSleep() } }
    tick(); const int = setInterval(tick, 1000); return () => clearInterval(int)
  }, [sleepEnd, pause, cancelSleep])

  if (!open) return null
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/80" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[71] animate-[slideUp_0.3s_ease]">
        <div className="max-w-3xl mx-auto bg-[#121212] border-t border-white/10 rounded-t-3xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2"><Moon size={18} className="text-white" /><div><h2 className="text-sm font-black text-white">Sleep Timer</h2><p className="text-[10px] text-white/40">Auto-stop setelah waktu habis</p></div></div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"><X size={16} /></button>
          </div>

          <div className="p-4">
            {sleepEnd ? (
              <div className="text-center py-4">
                <div className="text-[10px] font-black tracking-[0.2em] uppercase text-white/60 mb-2">⏱️ Timer Aktif</div>
                <div className="text-5xl font-black tabular-nums mb-4 text-white">{fmt(remaining)}</div>
                <button onClick={cancelSleep} className="px-5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">Batalkan Timer</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {OPTIONS.map((o) => (
                  <button key={o.min} onClick={() => { startSleep(o.min); onClose() }} className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 text-center hover:bg-white/10 active:scale-95 transition-all">
                    <div className="text-lg font-black text-white">{o.min}</div><div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-0.5">menit</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
