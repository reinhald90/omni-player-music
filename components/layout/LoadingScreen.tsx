'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type Phase = 'boot' | 'orbit' | 'merge' | 'ripple' | 'logo' | 'features' | 'progress' | 'done'

const FEATURES = [
  { icon: '🎵', text: 'Streaming Musik' },
  { icon: '🎤', text: 'Lirik Sinkron' },
  { icon: '📊', text: 'Visualizer Real' },
  { icon: '💾', text: 'Simpan Playlist' },
  { icon: '🎨', text: 'Share Kartu' },
  { icon: '🎧', text: 'Gratis Selamanya' },
]

export default function LoadingScreen() {
  const [phase, setPhase] = useState<Phase>('boot')
  const [featureIdx, setFeatureIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('opm-loaded') === '1') {
      setVisible(false)
      return
    }

    // ===== TIMELINE 10 DETIK =====
    const timeline: [number, Phase][] = [
      [0, 'boot'],
      [500, 'orbit'],
      [2000, 'merge'],
      [3000, 'ripple'],
      [3800, 'logo'],
      [5000, 'features'],
      [8000, 'progress'],
      [9800, 'done'],
      [10500, 'done'],
    ]

    const timers = timeline.map(([t, p]) =>
      setTimeout(() => setPhase(p), t)
    )

    // Feature cycling
    const featureInterval = setInterval(() => {
      setFeatureIdx((i) => (i + 1) % FEATURES.length)
    }, 550)

    // Progress bar animation 8s → 10s
    const progressStart = setTimeout(() => {
      let p = 0
      const pi = setInterval(() => {
        p += Math.random() * 4 + 2
        if (p >= 100) {
          p = 100
          clearInterval(pi)
        }
        setProgress(p)
      }, 80)
    }, 8000)

    const hideTimer = setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem('opm-loaded', '1')
    }, 10500)

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(featureInterval)
      clearTimeout(progressStart)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  const showOrbit = phase === 'orbit' || phase === 'boot'
  const showMerge = phase === 'merge' || phase === 'ripple' || phase === 'logo' || phase === 'features' || phase === 'progress'
  const showRipple = phase === 'ripple' || phase === 'logo' || phase === 'features' || phase === 'progress'
  const showLogo = phase === 'logo' || phase === 'features' || phase === 'progress'
  const showFeatures = phase === 'features' || phase === 'progress'
  const showProgress = phase === 'progress'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] overflow-hidden"
      style={{
        opacity: phase === 'done' ? 0 : 1,
        pointerEvents: phase === 'done' ? 'none' : 'auto',
        transition: 'opacity 0.8s cubic-bezier(0.65, 0, 0.35, 1)',
      }}
    >
      {/* ============ BACKGROUND GLOW ============ */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,45,85,0.25) 0%, rgba(192,132,252,0.12) 35%, transparent 70%)',
            filter: 'blur(80px)',
            opacity: showMerge ? 0.9 : 0.35,
            transition: 'opacity 1.5s ease',
          }}
        />
      </div>

      {/* ============ FLOATING PARTICLES ============ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => {
          const size = Math.random() * 4 + 2
          const left = Math.random() * 100
          const delay = Math.random() * 5
          const duration = Math.random() * 6 + 8
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                left: `${left}%`,
                bottom: '-10px',
                background: i % 3 === 0 ? '#ff2d55' : i % 3 === 1 ? '#c084fc' : '#ffffff',
                opacity: 0.4,
                boxShadow: '0 0 8px currentColor',
                animation: `floatUp ${duration}s ${delay}s linear infinite`,
              }}
            />
          )
        })}
      </div>

      {/* ============ CENTER CONTENT ============ */}
      <div className="relative flex flex-col items-center gap-12 px-6">
        {/* ============ ANIMATION STAGE ============ */}
        <div className="relative w-[220px] h-[220px] flex items-center justify-center">
          {/* ===== RIPPLE RINGS (muncul setelah merge) ===== */}
          {showRipple &&
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border"
                style={{
                  borderColor: i === 0 ? 'rgba(255,45,85,0.6)' : i === 1 ? 'rgba(192,132,252,0.4)' : 'rgba(255,255,255,0.2)',
                  borderWidth: 2,
                  animation: `rippleExpand 2.5s ${i * 0.4}s ease-out infinite`,
                  opacity: 0,
                }}
              />
            ))}

          {/* ===== 3 DOTS (orbit) ===== */}
          <div
            className="absolute inset-0 transition-all duration-1000"
            style={{
              opacity: showOrbit ? 1 : 0,
              transform: `rotate(${phase === 'orbit' ? 720 : 0}deg) scale(${showOrbit ? 1 : 0.4})`,
              transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
            }}
          >
            {[
              { top: '10%', left: '50%', delay: 0 },
              { top: '82%', left: '20%', delay: 0.25 },
              { top: '82%', left: '80%', delay: 0.5 },
            ].map((dot, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  top: dot.top,
                  left: dot.left,
                  width: 18,
                  height: 18,
                  transform: 'translate(-50%, -50%)',
                  background: 'linear-gradient(135deg, #ff2d55, #c084fc)',
                  boxShadow: '0 0 30px rgba(255,45,85,0.9), 0 0 60px rgba(192,132,252,0.5)',
                  animation: `dotPulse 1s ease-in-out ${dot.delay}s infinite`,
                }}
              />
            ))}
          </div>

          {/* ===== MERGED LOGO CIRCLE ===== */}
          <div
            className="absolute flex items-center justify-center rounded-full overflow-hidden"
            style={{
              width: showMerge ? 150 : 0,
              height: showMerge ? 150 : 0,
              background: 'linear-gradient(135deg, #ff2d55, #c084fc)',
              boxShadow:
                '0 0 80px rgba(255,45,85,0.6), 0 0 160px rgba(192,132,252,0.4), inset 0 0 40px rgba(255,255,255,0.1)',
              opacity: showMerge ? 1 : 0,
              padding: 5,
              transform: `scale(${phase === 'logo' ? 1.08 : phase === 'features' ? 1 : phase === 'progress' ? 1 : 1})`,
              transition:
                'all 1s cubic-bezier(0.34, 1.56, 0.64, 1), transform 2.5s ease-in-out',
            }}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden bg-[#050505]">
              <Image
                src="/icon.png"
                alt="Omni Player Music"
                fill
                sizes="150px"
                className="object-cover"
                style={{
                  opacity: showLogo ? 1 : 0,
                  transform: showLogo ? 'scale(1)' : 'scale(0.6)',
                  transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                priority
              />
            </div>
          </div>
        </div>

        {/* ============ TEXT AREA ============ */}
        <div
          className="text-center transition-all duration-700"
          style={{
            opacity: showLogo ? 1 : 0,
            transform: showLogo ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <h1 className="text-3xl sm:text-4xl font-black gradient-text tracking-tight mb-2">
            Omni Player Music
          </h1>
          <p className="text-[10px] text-white/40 tracking-[0.4em] uppercase font-bold">
            Premium Player
          </p>
        </div>

        {/* ============ FEATURE CYCLING ============ */}
        <div
          className="h-10 flex items-center justify-center transition-all duration-500"
          style={{
            opacity: showFeatures ? 1 : 0,
            transform: showFeatures ? 'translateY(0)' : 'translateY(15px)',
          }}
        >
          {showFeatures && (
            <div key={featureIdx} className="flex items-center gap-3 animate-[fadeIn_0.4s]">
              <span className="text-2xl">{FEATURES[featureIdx].icon}</span>
              <span className="text-sm font-bold text-white/80 tracking-wide">
                {FEATURES[featureIdx].text}
              </span>
            </div>
          )}
        </div>

        {/* ============ PROGRESS BAR ============ */}
        <div
          className="w-[240px] transition-all duration-700"
          style={{
            opacity: showProgress ? 1 : phase === 'boot' || phase === 'orbit' ? 0 : 0.6,
            transform: showProgress ? 'translateY(0)' : 'translateY(10px)',
          }}
        >
          <div className="h-[3px] rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #ff2d55, #ff6b9d, #c084fc)',
                boxShadow: '0 0 16px rgba(255,45,85,0.7)',
                transition: 'width 0.3s cubic-bezier(0.65, 0, 0.35, 1)',
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-2.5">
            <span className="text-[10px] text-white/40 font-mono tracking-wider">
              {showProgress ? `${Math.floor(progress)}%` : 'Memuat…'}
            </span>
            <span className="text-[10px] text-white/30 font-mono tracking-wider">
              omniplayermusic.web.id
            </span>
          </div>
        </div>
      </div>

      {/* ============ BOTTOM BRANDING ============ */}
      <div
        className="absolute bottom-8 left-0 right-0 text-center transition-opacity duration-700"
        style={{ opacity: showLogo ? 0.5 : 0 }}
      >
        <p className="text-[9px] text-white/30 tracking-[0.3em] uppercase font-bold">
          Made with ♥ by Ashiro
        </p>
      </div>
    </div>
  )
}
