'use client'

import { SITE_CONFIG } from '@/lib/constants'
import {
  Sparkles, Music2, Radio, Zap, Heart, Code2, Palette, ShieldCheck,
  Layers, Cpu, UploadCloud, MessageSquare, Shield
} from 'lucide-react'

const FEATURES = [
  { icon: Music2, title: 'Streaming Instan', desc: 'Cari lagu dari YouTube dan putar langsung tanpa install.', color: 'text-pink-400', bg: 'from-pink-500/20 to-pink-500/5', border: 'hover:border-pink-500/50' },
  { icon: Sparkles, title: 'Lirik Sinkron', desc: 'Lirik bergerak sesuai lagu. Ada mode karaoke-nya juga!', color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-500/5', border: 'hover:border-purple-500/50' },
  { icon: Zap, title: 'Visualizer Real', desc: 'Irama batang & partikel bergerak mengikuti frekuensi audio.', color: 'text-cyan-400', bg: 'from-cyan-500/20 to-cyan-500/5', border: 'hover:border-cyan-500/50' },
  { icon: UploadCloud, title: 'Komunitas & Reels', desc: 'Upload lagu karyamu. Nikmati scroll musik ala TikTok.', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5', border: 'hover:border-emerald-500/50' },
  { icon: MessageSquare, title: 'Chat Global', desc: 'Ngobrol bareng pengguna lain real-time sambil dengar musik.', color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-500/5', border: 'hover:border-amber-500/50' },
  { icon: ShieldCheck, title: 'Akun & Playlist', desc: 'Login aman (Firebase) untuk simpan Favorit di cloud.', color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-500/5', border: 'hover:border-blue-500/50' },
  { icon: Code2, title: 'Developer API', desc: 'Dapatkan API Key eksklusif untuk Bot WhatsApp atau web lain.', color: 'text-rose-400', bg: 'from-rose-500/20 to-rose-500/5', border: 'hover:border-rose-500/50' },
  { icon: Heart, title: 'Gratis Tanpa Iklan', desc: 'Streaming lagu tanpa biaya dan tanpa iklan mengganggu.', color: 'text-red-400', bg: 'from-red-500/20 to-red-500/5', border: 'hover:border-red-500/50' },
]

const STACK = [
  { name: 'Next.js 14', icon: '▲' },
  { name: 'TypeScript', icon: 'TS' },
  { name: 'Tailwind', icon: '🌊' },
  { name: 'Zustand', icon: '🐻' },
  { name: 'Neon DB', icon: '🐘' },
  { name: 'Firebase', icon: '🔥' },
  { name: 'VPS Kyoka', icon: '🖥️' },
  { name: 'iKyyXD API', icon: '🎵' },
]

export default function AboutPage() {
  return (
    <div className="relative max-w-4xl mx-auto px-4 py-8 overflow-hidden">
      
      {/* 🔥 BACKGROUND PARTICLES (Melayang di belakang) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white/5 blur-[1px]"
            style={{
              width: Math.random() * 6 + 2 + 'px',
              height: Math.random() * 6 + 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animation: `floatParticle ${Math.random() * 5 + 5}s ease-in-out infinite alternate`,
              animationDelay: Math.random() * 2 + 's'
            }}
          />
        ))}
      </div>

      {/* === HERO SECTION === */}
      <div className="text-center mb-16 relative">
        {/* SVG Animasi Wave di Belakang Judul */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-32 -z-10 opacity-30 pointer-events-none">
          <svg viewBox="0 0 1000 200" className="w-full h-full">
            <path 
              d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100" 
              fill="none" 
              stroke="url(#pink-gradient)" 
              strokeWidth="4"
              className="animate-[dash_3s_linear_infinite]"
              strokeDasharray="200 800"
            />
            <path 
              d="M0,100 C150,0 350,200 500,100 C650,0 850,200 1000,100" 
              fill="none" 
              stroke="url(#purple-gradient)" 
              strokeWidth="2"
              className="animate-[dash_4s_linear_infinite_reverse]"
              strokeDasharray="100 900"
            />
            <defs>
              <linearGradient id="pink-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff2d55" stopOpacity="0" />
                <stop offset="50%" stopColor="#ff2d55" stopOpacity="1" />
                <stop offset="100%" stopColor="#ff2d55" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="purple-gradient" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="1" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 border border-white/10 shadow-[0_0_20px_rgba(255,45,85,0.2)] animate-[float_3s_ease-in-out_infinite]">
          <Sparkles size={14} className="text-brand animate-pulse" />
          <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white/80">
            Premium Music Platform
          </span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight">
          <span className="gradient-text">Omni Player</span> <br className="sm:hidden" />
          <span className="text-white">Music</span>
        </h1>
        
        <p className="text-sm sm:text-base text-white/60 max-w-lg mx-auto leading-relaxed">
          Bukan sekadar pemutar musik. Ini adalah <b>ekosistem</b> tempat kamu mendengarkan lagu, 
          mengunggah karya sendiri, dan terhubung dengan komunitas — semuanya gratis.
        </p>
      </div>

      {/* === FITUR UNGGULAN (Grid 3D) === */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="p-2 rounded-lg bg-brand/20 border border-brand/30"><Layers size={18} className="text-brand" /></div>
          <h2 className="text-xl font-black">Fitur Kelas Enterprise</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`group relative rounded-3xl p-[1px] bg-gradient-to-br ${f.bg} transition-all duration-300 ${f.border} hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="absolute inset-0 bg-[#0a0a0e] rounded-3xl m-[1px] -z-10" />
              <div className="p-5 h-full flex flex-col">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={22} className={f.color} />
                </div>
                <h3 className="text-sm font-black text-white mb-1">{f.title}</h3>
                <p className="text-[11px] text-white/50 leading-relaxed mt-auto">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === TECH STACK (Pills) === */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30"><Cpu size={18} className="text-cyan-400" /></div>
          <h2 className="text-xl font-black">Teknologi Modern</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {STACK.map((t, i) => (
            <div 
              key={t.name} 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-white/10 hover:border-white/30 hover:bg-white/10 transition-colors cursor-default"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-sm">{t.icon}</span>
              <span className="text-[11px] font-bold text-white/80">{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* === KEAMANAN & DEVELOPER === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
        {/* Keamanan */}
        <div className="glass rounded-3xl p-6 relative overflow-hidden group border border-emerald-500/20 bg-emerald-500/5">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full group-hover:scale-150 transition-transform duration-700" />
          <ShieldCheck size={28} className="text-emerald-400 mb-4" />
          <h3 className="text-base font-black text-white mb-2">Privasi Terjamin</h3>
          <p className="text-xs text-white/50 leading-relaxed mb-4">
            Autentikasi diamankan oleh Google Firebase. File disimpan dengan enkripsi SSL. 
            Dilengkapi proteksi <b>Anti-DDoS</b> dan <b>Rate Limit</b>.
          </p>
          <div className="flex gap-2">
            <span className="text-[9px] font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">SSL Enkripsi</span>
            <span className="text-[9px] font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">No Tracking</span>
          </div>
        </div>

        {/* Developer */}
        <div className="glass rounded-3xl p-6 relative overflow-hidden border border-brand/20 bg-brand/5">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand/20 blur-2xl rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-brand rounded-full animate-ping opacity-20" />
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-2xl relative z-10 border-2 border-[#0a0a0e]">
                🎧
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-white">{SITE_CONFIG.author}</h3>
              <p className="text-[10px] font-bold text-brand uppercase tracking-wider">Creator & Founder</p>
            </div>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            Full-stack developer & music enthusiast. Membangun Omni Player Music dari nol dengan ❤️ untuk komunitas.
          </p>
        </div>
      </div>

      {/* === CTA === */}
      <div className="text-center pb-10">
        <a
          href={SITE_CONFIG.channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 transition-all active:scale-95"
        >
          <Radio size={18} className="animate-pulse" />
          Ikuti Saluran WhatsApp
        </a>
        <p className="text-[10px] text-white/30 mt-6 tracking-wider uppercase font-semibold">
          Made with <span className="text-brand animate-beat inline-block">♥</span> · {new Date().getFullYear()}
        </p>
      </div>

      {/* 🔥 CUSTOM KEYFRAMES UNTUK SVG & PARTIKEL */}
      <style jsx>{`
        @keyframes dash {
          to { stroke-dashoffset: -1000; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-50px) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
