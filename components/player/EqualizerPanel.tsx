'use client'

import { X, Sliders, RotateCcw, Power, Sparkles } from 'lucide-react'
import {
  useAudioFxStore,
  PRESETS,
  EQ_BANDS,
  type PresetId,
} from '@/store/audioFxStore'
import { clsx } from 'clsx'

interface Props {
  open: boolean
  onClose: () => void
}

const PRESET_ORDER: PresetId[] = [
  'flat',
  'bass',
  'treble',
  'vocal',
  'rock',
  'pop',
  'electronic',
]

export default function EqualizerPanel({ open, onClose }: Props) {
  const enabled = useAudioFxStore((s) => s.enabled)
  const preset = useAudioFxStore((s) => s.preset)
  const gains = useAudioFxStore((s) => s.gains)
  const bassBoost = useAudioFxStore((s) => s.bassBoost)
  const preamp = useAudioFxStore((s) => s.preamp)

  const setEnabled = useAudioFxStore((s) => s.setEnabled)
  const setPreset = useAudioFxStore((s) => s.setPreset)
  const setBandGain = useAudioFxStore((s) => s.setBandGain)
  const setBassBoost = useAudioFxStore((s) => s.setBassBoost)
  const setPreamp = useAudioFxStore((s) => s.setPreamp)
  const reset = useAudioFxStore((s) => s.reset)

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-[71] animate-[slideUp_0.3s_ease]">
        <div className="max-w-3xl mx-auto bg-[#0e0e12] border-t border-white/10 rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-none">
            <div className="flex items-center gap-2.5">
              <div
                className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                  enabled
                    ? 'bg-brand/20 border border-brand/40'
                    : 'bg-white/5 border border-white/10'
                )}
              >
                <Sliders size={16} className={enabled ? 'text-brand' : 'text-white/60'} />
              </div>
              <div>
                <h2 className="text-sm font-black">Equalizer</h2>
                <p className="text-[10px] text-white/40">
                  {enabled ? 'Aktif — audio di-tweak' : 'Non-aktif'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEnabled(!enabled)}
                className={clsx(
                  'w-10 h-6 rounded-full transition-all relative',
                  enabled ? 'bg-brand' : 'bg-white/10'
                )}
                aria-label="Toggle EQ"
              >
                <span
                  className={clsx(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all',
                    enabled ? 'left-[22px]' : 'left-0.5'
                  )}
                />
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 active:scale-90 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Presets */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles size={11} className="text-brand" />
                <span className="text-[10px] font-black tracking-wider uppercase text-white/50">
                  Preset
                </span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {PRESET_ORDER.map((id) => {
                  const p = PRESETS[id]
                  const active = preset === id
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setPreset(id)
                        if (!enabled) setEnabled(true)
                      }}
                      className={clsx(
                        'px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex-none transition-all active:scale-95',
                        active
                          ? 'bg-brand/20 text-brand border border-brand/40'
                          : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {p.name}
                    </button>
                  )
                })}
                {preset === 'custom' && (
                  <span className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex-none bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    Custom
                  </span>
                )}
              </div>
            </div>

            {/* EQ Sliders */}
            <div
              className={clsx(
                'transition-opacity',
                !enabled && 'opacity-40 pointer-events-none'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black tracking-wider uppercase text-white/50">
                  5-Band EQ
                </span>
                <button
                  onClick={() => setPreset('flat')}
                  className="flex items-center gap-1 text-[10px] font-bold text-white/40 hover:text-white/80 px-2 py-1 rounded transition-all"
                >
                  <RotateCcw size={10} />
                  Reset
                </button>
              </div>

              <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                <div className="flex justify-between gap-2">
                  {EQ_BANDS.map((band, i) => {
                    const value = gains[i] ?? 0
                    return (
                      <div key={band.freq} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[9px] font-mono text-white/40 font-bold">
                          {value > 0 ? '+' : ''}
                          {value.toFixed(0)}
                        </span>
                        <div className="relative h-32 flex items-center">
                          <input
                            type="range"
                            min={-12}
                            max={12}
                            step={1}
                            value={value}
                            onChange={(e) =>
                              setBandGain(i, parseFloat(e.target.value))
                            }
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-white/10 rounded-full appearance-none cursor-pointer origin-center -rotate-90
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-4
                              [&::-webkit-slider-thumb]:h-4
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-brand
                              [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,45,85,0.7)]
                              [&::-moz-range-thumb]:w-4
                              [&::-moz-range-thumb]:h-4
                              [&::-moz-range-thumb]:rounded-full
                              [&::-moz-range-thumb]:bg-brand
                              [&::-moz-range-thumb]:border-0"
                          />
                        </div>
                        <span className="text-[9px] font-black text-white/60 tracking-wider">
                          {band.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Bass Boost + Preamp */}
            <div
              className={clsx(
                'grid grid-cols-1 gap-3 transition-opacity',
                !enabled && 'opacity-40 pointer-events-none'
              )}
            >
              {/* Bass Boost */}
              <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔊</span>
                    <div>
                      <div className="text-[11px] font-black">Bass Boost</div>
                      <div className="text-[9px] text-white/40">Tambah power di bass</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-black text-brand">
                    +{bassBoost.toFixed(0)}dB
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={bassBoost}
                  onChange={(e) => setBassBoost(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3.5
                    [&::-webkit-slider-thumb]:h-3.5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-brand
                    [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,45,85,0.7)]"
                />
              </div>

              {/* Preamp */}
              <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📢</span>
                    <div>
                      <div className="text-[11px] font-black">Preamp</div>
                      <div className="text-[9px] text-white/40">Volume sebelum EQ</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-black text-cyan-400">
                    {preamp > 0 ? '+' : ''}
                    {preamp.toFixed(0)}dB
                  </span>
                </div>
                <input
                  type="range"
                  min={-6}
                  max={6}
                  step={1}
                  value={preamp}
                  onChange={(e) => setPreamp(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3.5
                    [&::-webkit-slider-thumb]:h-3.5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-cyan-400
                    [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                />
              </div>
            </div>

            {/* Info */}
            <div className="bg-brand/5 border border-brand/20 rounded-xl p-3 flex items-start gap-2.5">
              <Power size={13} className="text-brand mt-0.5 flex-none" />
              <p className="text-[10px] text-white/60 leading-relaxed">
                Equalizer mengubah audio secara real-time. Kalau lagu kedengeran pecah,
                turunin <b className="text-white">Bass Boost</b> atau <b className="text-white">Preamp</b>.
              </p>
            </div>

            {/* Reset */}
            <button
              onClick={reset}
              className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 transition-all active:scale-95"
            >
              Reset Semua Pengaturan
            </button>

            <div className="h-2" />
          </div>
        </div>
      </div>
    </>
  )
}
