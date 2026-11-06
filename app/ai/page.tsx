'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { usePlayerStore } from '@/store/playerStore'
import { auth } from '@/lib/firebase' // ⬅️ TAMBAHAN: Import Firebase Auth
import { Send, Bot, User, Loader2, ArrowLeft, Trash2, Copy, Check, ChevronDown, Cpu } from 'lucide-react'
import { clsx } from 'clsx'
import MarkdownRenderer from '@/components/ai/MarkdownRenderer'

interface Message {
  role: 'user' | 'assistant'
  content: string
  model?: string
}

const MODELS = [
  { id: 'gpt-6.1-sol', name: 'GPT-6.1 Sol', desc: 'Cerdas & Serba Bisa' },
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', desc: 'Analitis & Panjang' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', desc: 'Cepat & Ringan' },
]

const SUGGESTIONS = [
  'Jelaskan cara pakai fitur Reels',
  'Buatkan puisi tentang musik',
  'Apa itu Border Studio?',
  'Cara bikin API Key di sini?',
]

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: `Halo! Aku **Omni AI** 🤖, asisten pintar kamu di **Omni Player Music**. 

Aku sudah terhubung langsung dengan pengetahuan tentang web ini. Kamu bisa tanya aku tentang:
- **Fitur Web** (Reels, Border Studio, Playlist, dll)
- **Coding** (JavaScript, Python, React, dll)
- Atau sekadar **ngobrol santai**!

Pilih model AI di pojok kanan atas, lalu kirim pesanmu. 👇`,
}

export default function AIPage() {
  const router = useRouter()
  const { user, initialized, isAuthenticated } = useAuthStore()
  const setHideMiniPlayer = usePlayerStore((s) => s.setHideMiniPlayer)

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [model, setModel] = useState(MODELS[0].id)
  const [showModelMenu, setShowModelMenu] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (initialized && !isAuthenticated) router.push('/')
    setHideMiniPlayer(true)
    return () => setHideMiniPlayer(false)
  }, [initialized, isAuthenticated, router, setHideMiniPlayer])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  const sendMessage = async (text?: string) => {
    const finalText = text || input.trim()
    if (!finalText || loading) return

    const userMsg: Message = { role: 'user', content: finalText }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setShowModelMenu(false)

    try {
      const payloadMessages = newMessages
        .filter((m) => !(m.role === 'assistant' && m.content === INITIAL_MESSAGE.content))
        .map((m) => ({ role: m.role, content: m.content }))

      // ⬅️ Ambil Bearer Token
      const token = await auth.currentUser?.getIdToken()

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}) // ⬅️ Tambahkan Bearer Token
        },
        body: JSON.stringify({ messages: payloadMessages, model }),
      })

      const json = await res.json()

      if (json.success && json.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: json.reply, model: json.model || model },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ **Error:** ${json.error || 'Terjadi kesalahan pada server AI.'}`,
            model: model,
          },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Gagal terhubung ke server AI.', model },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClear = () => {
    if (!confirm('Hapus semua percakapan?')) return
    setMessages([INITIAL_MESSAGE])
  }

  const handleCopyMessage = (idx: number, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  if (!initialized || !user) return null

  const currentModelInfo = MODELS.find((m) => m.id === model) || MODELS[0]

  return (
    <div className="fixed inset-0 top-16 bottom-0 flex flex-col max-w-4xl mx-auto bg-[#050505] z-40">

      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/70 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg">
            <Bot size={18} className="text-black" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white flex items-center gap-1.5">
              Omni AI{' '}
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-bold border border-white/5">
                BETA
              </span>
            </h1>
            <p className="text-[10px] text-white/40">Asisten Cerdas Omni Player</p>
          </div>
        </div>

        {/* Model Selector */}
        <div className="relative">
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-[#222] transition-colors"
          >
            <Cpu size={14} className="text-white/60" />
            <span className="text-xs font-bold text-white">{currentModelInfo.name}</span>
            <ChevronDown size={14} className="text-white/40" />
          </button>

          {showModelMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowModelMenu(false)} />
              <div className="absolute right-0 top-10 z-40 w-56 bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-[fadeIn_0.15s]">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setModel(m.id)
                      setShowModelMenu(false)
                    }}
                    className={clsx(
                      'w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0',
                      model === m.id ? 'bg-white/10' : ''
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={clsx(
                          'text-xs font-bold',
                          model === m.id ? 'text-white' : 'text-white/80'
                        )}
                      >
                        {m.name}
                      </span>
                      {model === m.id && <Check size={14} className="text-green-400" />}
                    </div>
                    <div className="text-[10px] text-white/40 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg, idx) => {
          const isMe = msg.role === 'user'
          const label =
            msg.model && MODELS.find((m) => m.id === msg.model)?.name
              ? MODELS.find((m) => m.id === msg.model)!.name
              : currentModelInfo.name

          return (
            <div
              key={idx}
              className={clsx('flex gap-3 group', isMe ? 'flex-row-reverse' : 'flex-row')}
            >
              <div
                className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center flex-none shadow-md mt-1',
                  isMe
                    ? 'bg-white text-black'
                    : 'bg-[#1a1a1a] text-white border border-white/10'
                )}
              >
                {isMe ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div
                className={clsx(
                  'max-w-[85%] relative',
                  isMe
                    ? 'bg-white text-black rounded-2xl rounded-tr-sm px-4 py-3'
                    : 'bg-[#121212] text-white rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5'
                )}
              >
                {isMe ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div>
                    <MarkdownRenderer content={msg.content} />

                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleCopyMessage(idx, msg.content)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-white/70 transition-colors"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check size={11} className="text-green-400" /> Tersalin
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Copy
                          </>
                        )}
                      </button>
                      <span className="text-[9px] text-white/20">{label}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-none border border-white/10 mt-1">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-[#121212] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && !loading && (
        <div className="flex-none px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="text-left px-3 py-2 rounded-lg bg-[#121212] hover:bg-[#1a1a1a] border border-white/5 hover:border-white/10 text-[11px] text-white/60 hover:text-white transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-none p-3 border-t border-white/5 bg-[#0a0a0a] z-20">
        <div className="flex items-end gap-2 bg-[#121212] border border-white/10 rounded-2xl p-2 focus-within:border-white/20 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={`Tanya ${currentModelInfo.name}...`}
            className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/30 outline-none resize-none max-h-[120px] leading-relaxed"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-none transition-all active:scale-95',
              input.trim() && !loading
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            )}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-[9px] text-white/20">AI dapat membuat kesalahan.</p>
          {messages.length > 1 && (
            <button
              onClick={handleClear}
              className="text-[9px] text-white/30 hover:text-red-400 font-bold flex items-center gap-1 transition-colors"
            >
              <Trash2 size={10} /> Bersihkan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
