'use client'

import { useState } from 'react'
import { Palette, X, Check } from 'lucide-react'
import { useThemeStore, THEMES, type ThemeId } from '@/store/themeStore'
import { clsx } from 'clsx'

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const themeId = useThemeStore((s) => s.themeId)
  const setTheme = useThemeStore((s) => s.setTheme)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90 flex-none"
        aria-label="Tema"
      >
        <Palette size={15} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
            <div className="glass-strong rounded-3xl p-5 w-full max-w-sm pointer-events-auto animate-[fadeIn_0.2s]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Palette size={15} className="text-brand" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black">Pilih Tema</h2>
                    <p className="text-[10px] text-white/40">Warna untuk seluruh web</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(Object.values(THEMES) as any[]).map((t) => {
                  const active = themeId === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id as ThemeId)
                      }}
                      className={clsx(
                        'relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95',
                        active
                          ? 'bg-white/10 border border-white/20'
                          : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.08]'
                      )}
                    >
                      <div
                        className="w-12 h-12 rounded-full shadow-lg relative"
                        style={{
                          background: `linear-gradient(135deg, ${t.brand}, ${t.brandDark})`,
                          boxShadow: `0 8px 24px -6px ${t.brand}66`,
                        }}
                      >
                        {active && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center ring-2 ring-black">
                            <Check size={11} className="text-black" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span
                        className={clsx(
                          'text-[10px] font-bold',
                          active ? 'text-white' : 'text-white/50'
                        )}
                      >
                        {t.name}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className="text-[10px] text-white/30 text-center mt-4">
                Tema tersimpan otomatis di browser kamu
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
