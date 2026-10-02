import { SITE_CONFIG } from '@/lib/constants'
import { Radio, ExternalLink } from 'lucide-react'

export default function ChannelPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <Radio size={12} className="text-green-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
            Channel
          </span>
        </div>
        <h1 className="text-3xl font-black gradient-text mb-2">Saluran WhatsApp</h1>
        <p className="text-sm text-white/50">Ikuti update terbaru dari Omni Player Music</p>
      </div>

      <a
        href={SITE_CONFIG.channel.url}
        target="_blank"
        rel="noopener noreferrer"
        className="glass rounded-2xl p-6 flex flex-col items-center gap-4 hover:bg-white/[0.06] transition-all group"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
          <Radio size={28} className="text-white" />
        </div>
        <div className="text-center">
          <div className="text-sm font-bold mb-1">{SITE_CONFIG.channel.name}</div>
          <div className="text-[10px] text-white/40 font-mono break-all">
            {SITE_CONFIG.channel.jid}
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/15 text-green-400 text-xs font-black uppercase tracking-wider border border-green-500/30 group-hover:bg-green-500/25 transition-all">
          Ikuti Saluran <ExternalLink size={12} />
        </div>
      </a>
    </div>
  )
}
