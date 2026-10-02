import { SITE_CONFIG } from '@/lib/constants'
import { Github, Radio, Sparkles } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <Sparkles size={12} className="text-brand" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
            About
          </span>
        </div>
        <h1 className="text-3xl font-black gradient-text mb-2">{SITE_CONFIG.name}</h1>
        <p className="text-sm text-white/50">{SITE_CONFIG.description}</p>
      </div>

      <div className="space-y-3">
        <a
          href={SITE_CONFIG.channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.06] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-none">
            <Radio size={18} className="text-green-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold">Saluran WhatsApp</div>
            <div className="text-xs text-white/50">{SITE_CONFIG.channel.name}</div>
          </div>
        </a>
      </div>

      <div className="text-center text-xs text-white/30 mt-16">
        Made with <span className="text-brand animate-beat inline-block">♥</span> by {SITE_CONFIG.author}
      </div>
    </div>
  )
}
