'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Check, Loader2, Sparkles, Image as ImageIcon, Code2, Download } from 'lucide-react'
import { clsx } from 'clsx'

const PRESETS = [
  { name: 'Gold Owner', css: 'conic-gradient(from 0deg, transparent 0%, #f59e0b 20%, #fbbf24 50%, transparent 80%)' },
  { name: 'Neon Cyber', css: 'conic-gradient(from 0deg, transparent 0%, #00ffff 20%, #ff00ff 50%, transparent 80%)' },
  { name: 'Emerald', css: 'conic-gradient(from 0deg, transparent 0%, #10b981 20%, #34d399 50%, transparent 80%)' },
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
  
  // Tabs
  const [tab, setTab] = useState<'preset' | 'image' | 'code'>('preset')
  const [imageUrl, setImageUrl] = useState('')
  const [svgCode, setSvgCode] = useState('')

  useEffect(() => {
    if (initialized && !user) router.push('/')
    if (user?.borderStyle) setCustomCss(user.borderStyle)
  }, [initialized, user, router])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000) }

  const handleApply = async (css: string) => {
    if (!user) return
    setSaving(true)
    try {
      await updateProfileData({ borderStyle: css })
      setCustomCss(css)
      showToast('Border berhasil dipasang!')
    } catch (e) {
      alert('Gagal memasang border')
    } finally {
      setSaving(false)
    }
  }

  const handleImageApply = () => {
    if (!imageUrl) return
    const css = `url('${imageUrl}') center/cover no-repeat`
    handleApply(css)
  }

  const handleSvgApply = () => {
    if (!svgCode) return
    const encoded = encodeURIComponent(svgCode)
    const css = `url('data:image/svg+xml;utf8,${encoded}') center/cover no-repeat`
    handleApply(css)
  }

  if (!initialized || !user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white mb-6"><ArrowLeft size={14} /> Kembali</button>

      {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white text-black text-xs font-bold">{toast}</div>}

      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Border Studio</h1>
        <p className="text-sm text-white/50">Buat dan pasang border profil sesukamu!</p>
      </div>

      {/* LIVE PREVIEW */}
      <div className="flex flex-col items-center justify-center p-8 bg-[#121212] border border-white/5 rounded-3xl mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative w-32 h-32 rounded-full p-[4px] transition-all duration-300 z-10" style={{ background: customCss || '#1a1a1a' }}>
          <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-[#121212]">
            {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white">{user.name.charAt(0)}</div>}
          </div>
        </div>
        <p className="text-xs text-white/40 mt-4 z-10">Preview Border</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => handleApply(p.css)} disabled={saving} className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] hover:bg-white/10 border border-white/5 rounded-xl transition-all">
                <div className="w-12 h-12 rounded-full p-[3px]" style={{ background: p.css }}>
                  <div className="w-full h-full rounded-full bg-[#121212]" />
                </div>
                <span className="text-[10px] font-bold text-white">{p.name}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'image' && (
          <div className="space-y-4">
            <p className="text-xs text-white/50">Masukkan URL gambar (PNG/JPG) yang ingin dijadikan border.</p>
            <input type="text" placeholder="https://contoh.com/border.png" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-white/30" />
            <button onClick={handleImageApply} disabled={saving || !imageUrl} className="w-full py-2.5 bg-white text-black text-xs font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16}/>} Pasang Border Gambar
            </button>
          </div>
        )}

        {tab === 'code' && (
          <div className="space-y-4">
            <p className="text-xs text-white/50">Paste kode SVG atau CSS Gradient.</p>
            <textarea value={svgCode} onChange={(e) => setSvgCode(e.target.value)} placeholder="<svg>...</svg> atau conic-gradient(...)" className="w-full h-24 bg-[#050505] border border-white/10 rounded-lg p-3 text-xs font-mono text-green-400 outline-none focus:border-white/30 resize-none" />
            <button onClick={handleSvgApply} disabled={saving || !svgCode} className="w-full py-2.5 bg-white text-black text-xs font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16}/>} Terapkan Kode
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
