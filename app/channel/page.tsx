'use client'

import { SITE_CONFIG } from '@/lib/constants'
import { Radio, ExternalLink, Users, Bell, Sparkles, Check } from 'lucide-react'
import { useState } from 'react'

export default function ChannelPage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SITE_CONFIG.channel.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <Radio size={12} className="text-emerald-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
            Channel
          </span>
        </div>
        <h1 className="text-3xl font-black gradient-text mb-2">Saluran WhatsApp</h1>
        <p className="text-sm text-white/50">
          Dapatkan update terbaru & fitur baru duluan
        </p>
      </div>

      {/* Big card */}
      <div className="glass rounded-3xl p-6 mb-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald-500/20 blur-[80px] pointer-events-none" />

        <div className="relative flex flex-col items-center text-center gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(16,185,129,0.6)]">
              <Radio size={44} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center border-4 border-black">
              <Check size={14} className="text-emerald-500" strokeWidth={4} />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black">{SITE_CONFIG.channel.name}</h2>
            <p className="text-xs text-white/50 mt-1 break-all font-mono">
              {SITE_CONFIG.channel.jid}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <Users size={10} />
              Resmi
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
              <Bell size={10} />
              Update Rutin
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles size={10} />
              Gratis
            </span>
          </div>

          <div className="w-full space-y-2 mt-2">
            <a
              href={SITE_CONFIG.channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-black uppercase tracking-wider shadow-[0_15px_40px_-10px_rgba(16,185,129,0.6)] hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Radio size={16} />
              Ikuti Saluran
              <ExternalLink size={13} />
            </a>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl glass text-sm font-bold text-white/70 hover:bg-white/10 active:scale-95 transition-all"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Link Disalin!</span>
                </>
              ) : (
                <>
                  <ExternalLink size={14} />
                  Copy Link Channel
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass rounded-2xl p-4 text-center">
          <div className="text-2xl mb-2">📢</div>
          <div className="text-xs font-bold mb-1">Info Update</div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            Fitur baru & maintenance
          </p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="text-2xl mb-2">🎁</div>
          <div className="text-xs font-bold mb-1">Giveaway</div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            Event khusus follower
          </p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="text-2xl mb-2">💬</div>
          <div className="text-xs font-bold mb-1">Support</div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            Tanya jawab & bantuan
          </p>
        </div>
      </div>

      {/* Note */}
      <div className="glass rounded-2xl p-4 text-center">
        <p className="text-[11px] text-white/40 leading-relaxed">
          Saluran WhatsApp adalah fitur gratis. Kamu tidak akan menerima spam atau pesan
          pribadi dari kami.
        </p>
      </div>
    </div>
  )
}
