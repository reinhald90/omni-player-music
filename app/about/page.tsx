import { SITE_CONFIG } from '@/lib/constants'
import {
  Sparkles,
  Music2,
  Radio,
  Zap,
  Heart,
  Code2,
  Palette,
  Shield,
  Github,
  Globe,
  Layers,
  Cpu,
} from 'lucide-react'

export const metadata = {
  title: `Tentang — ${SITE_CONFIG.name}`,
  description: 'Tentang Omni Player Music',
}

const FEATURES = [
  {
    icon: Music2,
    title: 'Streaming Instan',
    desc: 'Cari lagu dan putar langsung tanpa install apapun.',
    color: 'text-brand',
    bg: 'bg-brand/10 border-brand/20',
  },
  {
    icon: Sparkles,
    title: 'Lirik Sinkron',
    desc: 'Lirik muncul otomatis, bergerak sesuai lagu.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: Zap,
    title: 'Visualizer Real',
    desc: 'Irama batang yang bergerak mengikuti frekuensi audio.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: Heart,
    title: 'Gratis Tanpa Batas',
    desc: 'Gak ada login, gak ada iklan, gak ada limit.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'Gak ada tracking. Riwayat disimpan di browser kamu.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Palette,
    title: 'Desain Premium',
    desc: 'UI ala Apple Music dengan sentuhan glassmorphism.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
]

const STACK = [
  { name: 'Next.js 14', role: 'Framework' },
  { name: 'TypeScript', role: 'Bahasa' },
  { name: 'Tailwind CSS', role: 'Styling' },
  { name: 'Zustand', role: 'State' },
  { name: 'Web Audio API', role: 'Analisa suara' },
  { name: 'Vercel Edge', role: 'Proxy audio' },
  { name: 'iKyyXD API', role: 'Sumber audio' },
  { name: 'LRCLIB', role: 'Sumber lirik' },
]

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <Sparkles size={12} className="text-brand" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
            Tentang
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black gradient-text mb-3">
          {SITE_CONFIG.name}
        </h1>
        <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
          Music player modern langsung di browser. Streaming, lirik, visualizer, dan riwayat —
          semua gratis tanpa install apapun.
        </p>
      </div>

      {/* Features grid */}
      <section className="mb-10">
        <h2 className="text-lg font-black mb-4 flex items-center gap-2">
          <Layers size={18} className="text-brand" />
          Fitur Unggulan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-4 hover:bg-white/[0.06] transition-all"
            >
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${f.bg}`}
              >
                <f.icon size={16} className={f.color} />
              </div>
              <h3 className="text-sm font-bold mb-1">{f.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="mb-10">
        <h2 className="text-lg font-black mb-4 flex items-center gap-2">
          <Cpu size={18} className="text-brand" />
          Dibuat Dengan
        </h2>
        <div className="glass rounded-2xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STACK.map((t) => (
              <div key={t.name} className="text-center py-2">
                <div className="text-[11px] font-black text-white/90">{t.name}</div>
                <div className="text-[9px] text-white/40 uppercase tracking-wider font-semibold mt-0.5">
                  {t.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer card */}
      <section className="mb-10">
        <h2 className="text-lg font-black mb-4 flex items-center gap-2">
          <Code2 size={18} className="text-brand" />
          Developer
        </h2>
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-2xl flex-none shadow-lg shadow-brand/30">
            🎧
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-black">{SITE_CONFIG.author}</div>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">
              Full-stack developer & music enthusiast. Membuat tools gratis untuk semua.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <a
          href={SITE_CONFIG.channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-emerald-400 text-sm font-black uppercase tracking-wider hover:from-emerald-500/30 hover:to-emerald-600/20 transition-all active:scale-95"
        >
          <Radio size={14} />
          Ikuti Saluran WhatsApp
        </a>
        <p className="text-[10px] text-white/30 mt-4 tracking-wider uppercase font-semibold">
          Made with <span className="text-brand animate-beat inline-block">♥</span> · {new Date().getFullYear()}
        </p>
      </section>
    </div>
  )
}
