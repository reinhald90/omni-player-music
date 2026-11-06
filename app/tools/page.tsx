'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Loader2, Sparkles, Image as ImageIcon, Code2, Download, Flame, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'

const toSvgUrl = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}")`

const ANIMATED_SVG_PRESETS = [
  {
    name: 'Sovereign Gold',
    badge: 'OWNER',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fffbeb"/><stop offset="35%" stop-color="#f59e0b"/><stop offset="70%" stop-color="#b45309"/><stop offset="100%" stop-color="#fde047"/>
        </linearGradient>
        <filter id="glow1" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>
      <circle cx="100" cy="100" r="88" fill="none" stroke="url(#g1)" stroke-width="1" opacity="0.5">
        <animate attributeName="r" values="84;92;84" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.2;0.7;0.2" dur="3s" repeatCount="indefinite"/>
      </circle>
      <g>
        <circle cx="100" cy="100" r="84" fill="none" stroke="url(#g1)" stroke-width="1.5" stroke-dasharray="8 6 2 6" opacity="0.85"/>
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="16s" repeatCount="indefinite"/>
      </g>
      <g filter="url(#glow1)">
        <circle cx="100" cy="100" r="79" fill="none" stroke="url(#g1)" stroke-width="3.5" stroke-dasharray="45 65" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="6s" repeatCount="indefinite"/>
      </g>
      <circle cx="100" cy="100" r="75" fill="none" stroke="url(#g1)" stroke-width="2.5" filter="url(#glow1)"/>
      <g filter="url(#glow1)">
        <polygon points="100,6 104,14 100,22 96,14" fill="#fef08a"/>
        <polygon points="100,194 104,186 100,178 96,186" fill="#fef08a"/>
        <polygon points="6,100 14,104 22,100 14,96" fill="#f59e0b"/>
        <polygon points="194,100 186,104 178,100 186,96" fill="#f59e0b"/>
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="9s" repeatCount="indefinite"/>
      </g>
    </svg>`
  },
  {
    name: 'Cyber Reactor',
    badge: 'ANIMATED',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <linearGradient id="c1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe"/><stop offset="50%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#ff007f"/>
        </linearGradient>
        <filter id="cglow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>
      <g opacity="0.75">
        <circle cx="100" cy="100" r="88" fill="none" stroke="#00f2fe" stroke-width="1.5" stroke-dasharray="4 10 24 10 4 10"/>
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="-360 100 100" dur="12s" repeatCount="indefinite"/>
      </g>
      <g filter="url(#cglow)">
        <circle cx="100" cy="100" r="81" fill="none" stroke="url(#c1)" stroke-width="4" stroke-dasharray="70 150" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="3s" repeatCount="indefinite"/>
      </g>
      <g>
        <circle cx="100" cy="100" r="77" fill="none" stroke="#ff007f" stroke-width="2" stroke-dasharray="15 30 5 30" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="5s" repeatCount="indefinite"/>
      </g>
      <circle cx="100" cy="100" r="74.5" fill="none" stroke="url(#c1)" stroke-width="2"/>
      <g filter="url(#cglow)">
        <circle cx="100" cy="12" r="3.5" fill="#00f2fe"><animate attributeName="r" values="2;4.5;2" dur="1.2s" repeatCount="indefinite"/></circle>
        <circle cx="100" cy="188" r="3.5" fill="#ff007f"><animate attributeName="r" values="4.5;2;4.5" dur="1.2s" repeatCount="indefinite"/></circle>
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="4.5s" repeatCount="indefinite"/>
      </g>
    </svg>`
  },
  {
    name: 'Crimson Eclipse',
    badge: 'ANIMATED',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <linearGradient id="cr1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff0844"/><stop offset="50%" stop-color="#991b1b"/><stop offset="100%" stop-color="#ffb199"/>
        </linearGradient>
        <filter id="bglow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>
      <circle cx="100" cy="100" r="82" fill="none" stroke="#ef4444" stroke-width="2.5" filter="url(#bglow)">
        <animate attributeName="r" values="75;91;75" dur="2.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0;0.9" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <g filter="url(#bglow)">
        <circle cx="100" cy="100" r="80" fill="none" stroke="url(#cr1)" stroke-width="4" stroke-dasharray="35 45 12 45" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="3.8s" repeatCount="indefinite"/>
      </g>
      <g>
        <circle cx="100" cy="100" r="86" fill="none" stroke="#fca5a5" stroke-width="2.2" stroke-dasharray="1 18" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="10s" repeatCount="indefinite"/>
      </g>
      <circle cx="100" cy="100" r="75" fill="none" stroke="url(#cr1)" stroke-width="2.5"/>
    </svg>`
  },
  {
    name: 'Astral Void',
    badge: 'ANIMATED',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <linearGradient id="as1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c084fc"/><stop offset="50%" stop-color="#6366f1"/><stop offset="100%" stop-color="#fde047"/>
        </linearGradient>
        <filter id="sglow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>
      <g opacity="0.5" filter="url(#sglow)">
        <rect x="28" y="28" width="144" height="144" rx="22" fill="none" stroke="url(#as1)" stroke-width="1.5"/>
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="14s" repeatCount="indefinite"/>
      </g>
      <g opacity="0.5" filter="url(#sglow)">
        <rect x="28" y="28" width="144" height="144" rx="22" fill="none" stroke="url(#as1)" stroke-width="1.5"/>
        <animateTransform attributeName="transform" type="rotate" from="45 100 100" to="-315 100 100" dur="14s" repeatCount="indefinite"/>
      </g>
      <g filter="url(#sglow)">
        <circle cx="100" cy="100" r="80" fill="none" stroke="url(#as1)" stroke-width="3.5" stroke-dasharray="50 40 10 40" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="4.5s" repeatCount="indefinite"/>
      </g>
      <circle cx="100" cy="100" r="75" fill="none" stroke="#fde047" stroke-width="2"/>
    </svg>`
  },
  {
    name: 'Emerald Matrix',
    badge: 'ANIMATED',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <linearGradient id="em1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981"/><stop offset="50%" stop-color="#a7f3d0"/><stop offset="100%" stop-color="#059669"/>
        </linearGradient>
        <filter id="eglow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>
      <g filter="url(#eglow)">
        <circle cx="100" cy="100" r="85" fill="none" stroke="url(#em1)" stroke-width="2" stroke-dasharray="2 12 8 12" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="8s" repeatCount="indefinite"/>
      </g>
      <g filter="url(#eglow)">
        <circle cx="100" cy="100" r="79" fill="none" stroke="#34d399" stroke-width="3.5" stroke-dasharray="60 90" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="3.2s" repeatCount="indefinite"/>
      </g>
      <circle cx="100" cy="100" r="74.5" fill="none" stroke="url(#em1)" stroke-width="2"/>
    </svg>`
  },
  {
    name: 'Solar Valkyrie',
    badge: 'ANIMATED',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <linearGradient id="sv1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/><stop offset="40%" stop-color="#fb923c"/><stop offset="80%" stop-color="#e11d48"/><stop offset="100%" stop-color="#fde047"/>
        </linearGradient>
        <filter id="vglow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>
      <g filter="url(#vglow)">
        <circle cx="100" cy="100" r="86" fill="none" stroke="url(#sv1)" stroke-width="2.5" stroke-dasharray="12 20" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="6s" repeatCount="indefinite"/>
      </g>
      <g filter="url(#vglow)">
        <circle cx="100" cy="100" r="80" fill="none" stroke="url(#sv1)" stroke-width="4" stroke-dasharray="80 70" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="2.5s" repeatCount="indefinite"/>
      </g>
      <circle cx="100" cy="100" r="75" fill="none" stroke="#fed7aa" stroke-width="2"/>
    </svg>`
  }
]

const GRADIENT_PRESETS = [
  { name: 'Gold Owner', css: 'linear-gradient(135deg, #fde047 0%, #f59e0b 50%, #fef08a 100%)' },
  { name: 'Neon Cyber', css: 'conic-gradient(from 0deg, #00f2fe, #7c3aed, #ff007f, #00f2fe)' },
  { name: 'Emerald', css: 'linear-gradient(135deg, #10b981, #34d399, #059669)' },
  { name: 'Sunset', css: 'linear-gradient(135deg, #f97316, #f43f5e, #c084fc)' },
  { name: 'Ocean', css: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)' },
  { name: 'Rainbow', css: 'conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)' },
]

export default function ToolsPage() {
  const router = useRouter()
  const { user, initialized, updateProfileData } = useAuthStore()
  const [customCss, setCustomCss] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  
  const [tab, setTab] = useState<'preset' | 'image' | 'code'>('preset')
  const [imageUrl, setImageUrl] = useState('')
  const [svgCode, setSvgCode] = useState('')

  useEffect(() => {
    if (initialized && !user) router.push('/')
    if (user?.borderStyle) setCustomCss(user.borderStyle)
  }, [initialized, user, router])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200) }

  const handleApply = async (css: string) => {
    if (!user) return
    setSaving(true)
    try {
      await updateProfileData({ borderStyle: css })
      setCustomCss(css)
      showToast(css ? 'Border berhasil dipasang!' : 'Border direset!')
    } catch (e) {
      alert('Gagal memasang border')
    } finally {
      setSaving(false)
    }
  }

  const handleImageApply = () => {
    if (!imageUrl.trim()) return
    // Simpan url() murni agar kompatibel dengan backgroundImage di halaman profil
    const css = `url("${imageUrl.trim()}")`
    handleApply(css)
  }

  const handleSvgApply = () => {
    const raw = svgCode.trim()
    if (!raw) return
    if (raw.startsWith('<svg')) {
      handleApply(toSvgUrl(raw))
    } else {
      handleApply(raw)
    }
  }

  if (!initialized || !user) return null

  const isUrlPreview = customCss.includes('url(')
  const isGradPreview = customCss.includes('gradient')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white"><ArrowLeft size={14} /> Kembali</button>
        {customCss && (
          <button onClick={() => handleApply('')} disabled={saving} className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
            <Trash2 size={12} /> Reset Border
          </button>
        )}
      </div>

      {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-white text-black text-xs font-black shadow-2xl">{toast}</div>}

      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Border Studio</h1>
        <p className="text-sm text-white/50">Buat dan pasang border profil sesukamu!</p>
      </div>

      {/* LIVE PREVIEW (IDENTIK DENGAN HALAMAN PROFIL) */}
      <div className="flex flex-col items-center justify-center p-10 bg-[#121212] border border-white/5 rounded-3xl mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div className="relative w-32 h-32 flex items-center justify-center z-10">
          {/* Layer 1: SVG / Image Border di Luar */}
          {isUrlPreview && (
            <div 
              className="absolute -inset-3 rounded-full pointer-events-none z-20"
              style={{
                backgroundImage: customCss,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
          )}

          {/* Layer 2: Cincin Tipis & Avatar */}
          <div 
            className="relative w-24 h-24 rounded-full p-[2.5px] flex items-center justify-center transition-all duration-300"
            style={{ background: isGradPreview ? customCss : '#262626' }}
          >
            <div className="w-full h-full rounded-full bg-black overflow-hidden border-[2px] border-[#121212] flex items-center justify-center">
              {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <div className="text-3xl font-black text-white">{user.name.charAt(0)}</div>}
            </div>
          </div>
        </div>

        <p className="text-xs text-white/40 mt-5 z-10">Preview Border</p>
      </div>

      {/* TABS */}
      <div className="grid grid-cols-3 gap-2 mb-4 bg-[#121212] p-1.5 rounded-xl border border-white/5">
        <button onClick={() => setTab('preset')} className={clsx('py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5', tab === 'preset' ? 'bg-white text-black' : 'text-white/50 hover:text-white')}><Sparkles size={14}/> Preset</button>
        <button onClick={() => setTab('image')} className={clsx('py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5', tab === 'image' ? 'bg-white text-black' : 'text-white/50 hover:text-white')}><ImageIcon size={14}/> Gambar</button>
        <button onClick={() => setTab('code')} className={clsx('py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5', tab === 'code' ? 'bg-white text-black' : 'text-white/50 hover:text-white')}><Code2 size={14}/> Kode / SVG</button>
      </div>

      {/* CONTENT */}
      <div className="bg-[#121212] border border-white/5 rounded-2xl p-5">
        
        {tab === 'preset' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400 mb-3">
                <Flame size={14} /> Animated SVG Borders
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ANIMATED_SVG_PRESETS.map((item) => {
                  const svgCss = toSvgUrl(item.svg)
                  return (
                    <button key={item.name} onClick={() => handleApply(svgCss)} disabled={saving} className="relative flex flex-col items-center gap-2 p-4 bg-[#1a1a1a] hover:bg-white/10 border border-white/5 hover:border-amber-500/30 rounded-xl transition-all group">
                      <span className="absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">{item.badge}</span>
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0" style={{ backgroundImage: svgCss, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
                        <div className="w-11 h-11 rounded-full bg-[#121212]" />
                      </div>
                      <span className="text-[11px] font-bold text-white">{item.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-wider text-white/50 mb-3">
                Simple Gradients
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GRADIENT_PRESETS.map((p) => (
                  <button key={p.name} onClick={() => handleApply(p.css)} disabled={saving} className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] hover:bg-white/10 border border-white/5 rounded-xl transition-all">
                    <div className="w-12 h-12 rounded-full p-[2.5px]" style={{ background: p.css }}>
                      <div className="w-full h-full rounded-full bg-[#121212]" />
                    </div>
                    <span className="text-[10px] font-bold text-white">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'image' && (
          <div className="space-y-4">
            <p className="text-xs text-white/50">Masukkan URL gambar transparan (PNG/GIF/WebP) yang ingin dijadikan bingkai profil.</p>
            <input type="text" placeholder="https://contoh.com/frame-avatar.png" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-white/30" />
            <button onClick={handleImageApply} disabled={saving || !imageUrl} className="w-full py-2.5 bg-white text-black text-xs font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16}/>} Pasang Border Gambar
            </button>
          </div>
        )}

        {tab === 'code' && (
          <div className="space-y-4">
            <p className="text-xs text-white/50">Paste kode mentah <code className="text-white">&lt;svg&gt;...&lt;/svg&gt;</code> atau CSS <code className="text-white">conic-gradient(...)</code> / <code className="text-white">linear-gradient(...)</code>.</p>
            <textarea value={svgCode} onChange={(e) => setSvgCode(e.target.value)} placeholder="<svg>...</svg> atau linear-gradient(...)" className="w-full h-32 bg-[#050505] border border-white/10 rounded-lg p-3 text-xs font-mono text-green-400 outline-none focus:border-white/30 resize-none" />
            <button onClick={handleSvgApply} disabled={saving || !svgCode} className="w-full py-2.5 bg-white text-black text-xs font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16}/>} Terapkan Kode
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
