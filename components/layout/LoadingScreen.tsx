'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type Phase = 'dots' | 'spin' | 'merge' | 'logo' | 'pulse' | 'done'

export default function LoadingScreen() {
  const [phase, setPhase] = useState<Phase>('dots')
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Cuma tampil sekali per tab session
    if (sessionStorage.getItem('opm-loaded') === '1') {
      setVisible(false)
      return
    }

    const t1 = setTimeout(() => setPhase('spin'), 600)
    const t2 = setTimeout(() => setPhase('merge'), 1600)
    const t3 = setTimeout(() => setPhase('logo'), 2200)
    const t4 = setTimeout(() => setPhase('pulse'), 2700)
    const t5 = setTimeout(() => {
      setPhase('done')
      sessionStorage.setItem('opm-loaded', '1')
    }, 3300)
    const t6 = setTimeout(() => setVisible(false), 4000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
      clearTimeout(t6)
    }
  }, [])

  if (!visible) return null

  const showDots = phase === 'dots' || phase === 'spin'
  const showMerge = phase !== 'dots' && phase !== 'spin'
  const showLogo = phase === 'logo' || phase === 'pulse'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]"
      style={{
        opacity: phase === 'done' ? 0 : 1,
        pointerEvents: phase === 'done' ? 'none' : 'auto',
        transition: 'opacity 0.7s cubic-bezier(0.65, 0, 0.35, 1)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,45,85,0.22) 0%, rgba(192,132,252,0.1) 40%, transparent 70%)',
            filter: 'blur(60px)',
            opacity: showMerge ? 0.9 : 0.3,
            transition: 'opacity 1s ease',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center gap-10">
        {/* Animation stage */}
        <div className="relative w-[160px] h-[160px] flex items-center justify-center">
          {/* ===== 3 dots (orbit) ===== */}
          <div
            className="absolute inset-0"
            style={{
              opacity: showDots ? 1 : 0,
              transform: `rotate(${phase === 'spin' ? 360 : 0}deg) scale(${showDots ? 1 : 0.5})`,
              transition:
                'transform 1.1s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.4s ease',
            }}
          >
            {[
              { top: '8%', left: '50%' },
              { top: '85%', left: '18%' },
              { top: '85%', left: '82%' },
            ].map((dot, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  top: dot.top,
                  left: dot.left,
                  transform: 'translate(-50%, -50%)',
                  background: 'linear-gradient(135deg, #ff2d55, #c084fc)',
                  boxShadow: '0 0 24px rgba(255,45,85,0.7)',
                  animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>

          {/* ===== Merged dot → Logo ===== */}
          <div
            className="absolute flex items-center justify-center rounded-full overflow-hidden"
            style={{
              width: showMerge ? 128 : 0,
              height: showMerge ? 128 : 0,
              background: 'linear-gradient(135deg, #ff2d55, #c084fc)',
              boxShadow:
                '0 0 60px rgba(255,45,85,0.5), 0 0 120px rgba(192,132,252,0.35)',
              opacity: showMerge ? 1 : 0,
              padding: 4,
              transform: `scale(${phase === 'pulse' ? 1.05 : 1})`,
              transition:
                'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 1.5s ease-in-out',
            }}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden bg-[#050505]">
              <Image
                src="/icon.png"
                alt="Omni Player Music"
                fill
                sizes="128px"
                className="object-cover"
                style={{
                  opacity: showLogo ? 1 : 0,
                  transform: showLogo ? 'scale(1)' : 'scale(0.7)',
                  transition:
                    'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                priority
              />
            </div>
          </div>
        </div>

        {/* ===== Text ===== */}
        <div
          className="text-center"
          style={{
            opacity: showLogo ? 1 : 0,
            transform: showLogo ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.7s cubic-bezier(0.65, 0, 0.35, 1) 0.15s',
          }}
        >
          <div className="text-2xl font-black gradient-text tracking-tight">
            Omni Player Music
          </div>
          <div className="text-[10px] text-white/40 tracking-[0.35em] uppercase font-bold mt-2">
            Premium Player
          </div>
        </div>

        {/* ===== Progress Bar ===== */}
        <div
          className="w-[200px] h-[2px] rounded-full bg-white/5 overflow-hidden"
          style={{
            opacity: phase === 'dots' ? 0 : phase === 'done' ? 0 : 1,
            transition: 'opacity 0.5s ease',
          }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #ff2d55, #c084fc)',
              width:
                phase === 'spin'
                  ? '35%'
                  : phase === 'merge'
                    ? '65%'
                    : phase === 'logo'
                      ? '88%'
                      : phase === 'pulse'
                        ? '100%'
                        : '0%',
              transition: 'width 0.8s cubic-bezier(0.65, 0, 0.35, 1)',
              boxShadow: '0 0 12px rgba(255,45,85,0.6)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
