'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Download, Share2, Loader2, Check, Image as ImageIcon } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import { generateShareCard } from '@/lib/cardGenerator'
import { clsx } from 'clsx'

interface Props {
  open: boolean
  onClose: () => void
}

type SizeMode = 'story' | 'post'

export default function ShareCardModal({ open, onClose }: Props) {
  const current = usePlayerStore((s) => s.current)
  const [size, setSize] = useState<SizeMode>('story')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cardBlob, setCardBlob] = useState<Blob | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  // Reset + generate saat buka / ganti size
  useEffect(() => {
    if (!open || !current) return
    let cancelled = false

    const generate = async () => {
      setGenerating(true)
      setPreviewUrl(null)
      setCardBlob(null)
      try {
        const blob = await generateShareCard(current, { size })
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setCardBlob(blob)
      } catch (e: any) {
        console.error('[ShareCard] Generate failed:', e)
        showToast('Gagal generate kartu')
      } finally {
        if (!cancelled) setGenerating(false)
      }
    }

    generate()

    return () => {
      cancelled = true
      // revoke url lama
    }
  }, [open, size, current])

  // Revoke URL saat modal close
  useEffect(() => {
    if (open) return
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [open, previewUrl])

  if (!open || !current) return null

  const handleDownload = () => {
    if (!cardBlob || !previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `omni-${current.title.replace(/[^\w\s]/g, '').slice(0, 40)}-${size}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showToast('Kartu tersimpan! 🎨')
  }

  const handleShare = async () => {
    if (!cardBlob) return
    try {
      const file = new File(
        [cardBlob],
        `omni-${current.title.slice(0, 30)}.png`,
        { type: 'image/png' }
      )
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: current.title,
          text: `🎵 ${current.title} — ${current.artist}\n\nDengerin gratis di Omni Player Music 🎧`,
        })
        showToast('Berhasil dibagikan!')
      } else {
        handleDownload()
        showToast('Disimpan — share manual ya')
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        showToast('Share gagal')
      }
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="fixed inset-0 z-[81] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div className="glass-strong rounded-3xl w-full max-w-sm max-h-[92vh] flex flex-col overflow-hidden pointer-events-auto animate-[fadeIn_0.2s]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 flex-none">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center">
                <ImageIcon size={15} className="text-brand" />
              </div>
              <div>
                <h2 className="text-sm font-black">Bagikan Lagu</h2>
                <p className="text-[10px] text-white/40">Generate kartu keren</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60"
            >
              <X size={14} />
            </button>
          </div>

          {/* Size Toggle */}
          <div className="p-3 flex-none">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/30 border border-white/5">
              {[
                { id: 'story' as SizeMode, label: 'Story', hint: '9:16' },
                { id: 'post' as SizeMode, label: 'Post', hint: '1:1' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSize(opt.id)}
                  className={clsx(
                    'py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                    size === opt.id
                      ? 'bg-brand/15 text-brand border border-brand/30'
                      : 'text-white/40 hover:text-white/70 border border-transparent'
                  )}
                >
                  {opt.label} <span className="text-white/30 font-bold">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-hidden px-3 pb-3 min-h-0">
            <div
              className={clsx(
                'relative w-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center',
                size === 'story' ? 'aspect-[9/16]' : 'aspect-square'
              )}
            >
              {generating || !previewUrl ? (
                <div className="flex flex-col items-center gap-3 text-white/40">
                  <Loader2 size={28} className="animate-spin text-brand" />
                  <span className="text-xs font-medium">Membuat kartu…</span>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="Share card preview"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 border-t border-white/5 flex-none">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                disabled={!cardBlob || generating}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-black uppercase tracking-wider transition-all active:scale-95"
              >
                <Download size={14} />
                Simpan
              </button>
              <button
                onClick={handleShare}
                disabled={!cardBlob || generating}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand to-brand-light text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-brand/30 disabled:opacity-40 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Share2 size={14} />
                Bagikan
              </button>
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/90 backdrop-blur-xl border border-white/10 text-xs font-bold animate-[fadeIn_0.2s] whitespace-nowrap flex items-center gap-2">
              <Check size={12} className="text-emerald-400" />
              {toast}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
