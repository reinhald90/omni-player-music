'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Send, BadgeCheck, MessageSquare, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface ChatMessage {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  is_verified: boolean
  message: string
  created_at: string
}

export default function GlobalChatPage() {
  const router = useRouter()
  const { user, initialized, isAuthenticated } = useAuthStore()
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)

  // Redirect jika belum login
  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.push('/')
    }
  }, [initialized, isAuthenticated, router])

  // Fungsi ambil pesan
  const fetchMessages = async (isFirstLoad = false) => {
    try {
      const res = await fetch('/api/db/chat')
      const json = await res.json()
      if (json.success) {
        setMessages(json.data)
        if (isFirstLoad) setTimeout(() => scrollToBottom('auto'), 100)
      }
    } catch (e) { console.error(e) }
    finally { if (isFirstLoad) setLoading(false) }
  }

  // Polling: Ambil pesan setiap 3 detik
  useEffect(() => {
    if (!isAuthenticated) return
    fetchMessages(true)
    const interval = setInterval(() => fetchMessages(false), 3000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Auto-scroll ke bawah jika user sedang di paling bawah
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior })
    }
  }

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    // Cek apakah user scroll-nya mendekati bawah (toleransi 50px)
    const isBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsScrolledToBottom(isBottom)
  }

  // Auto-scroll saat pesan baru masuk
  useEffect(() => {
    if (isScrolledToBottom) {
      scrollToBottom()
    }
  }, [messages, isScrolledToBottom])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user || sending) return

    setSending(true)
    const msgToSend = input.trim()
    setInput('')

    // Optimistic UI: Langsung tampilkan pesan kita (tanpa nunggu server)
    const tempMsg: ChatMessage = {
      id: Date.now().toString(),
      user_id: user.id,
      user_name: user.name,
      user_avatar: user.avatar || null,
      is_verified: user.isVerified || false,
      message: msgToSend,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])
    scrollToBottom()

    try {
      await fetch('/api/db/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: user.id, 
          name: user.name, 
          avatar: user.avatar, 
          isVerified: user.isVerified,
          message: msgToSend 
        })
      })
      fetchMessages(false) // Refresh dari server
    } catch (e) {
      alert('Gagal kirim pesan')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  if (!initialized || !user) return null

  return (
    <div className="fixed inset-0 top-16 bottom-0 flex flex-col max-w-4xl mx-auto bg-[#050505]">
      
      {/* Header Chat */}
      <div className="flex-none p-4 border-b border-white/5 bg-[#0a0a0e] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center">
          <MessageSquare size={18} className="text-brand" />
        </div>
        <div>
          <h1 className="text-sm font-black text-white">Obrolan Global</h1>
          <p className="text-[10px] text-white/40">Ngobrol bareng semua pengguna Omni Player</p>
        </div>
      </div>

      {/* Area Chat */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-white/30 text-xs py-10">Belum ada pesan. Jadilah yang pertama menyapa! 👋</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user.id
            return (
              <div key={msg.id} className={clsx("flex gap-2.5", isMe ? "flex-row-reverse" : "flex-row")}>
                
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-[10px] font-black flex-none overflow-hidden">
                  {msg.user_avatar ? (
                    <img src={msg.user_avatar} alt={msg.user_name} className="w-full h-full object-cover" />
                  ) : (
                    msg.user_name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Bubble Chat */}
                <div className={clsx("max-w-[75%] flex flex-col", isMe ? "items-end" : "items-start")}>
                  {/* Nama & Centang Biru */}
                  <div className="flex items-center gap-1 mb-1 px-1">
                    <span className="text-[10px] text-white/40 font-bold">{isMe ? 'Kamu' : msg.user_name}</span>
                    {msg.is_verified && <BadgeCheck size={10} className="text-blue-500" />}
                  </div>
                  
                  <div className={clsx(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    isMe 
                      ? "bg-brand text-white rounded-tr-sm" 
                      : "bg-white/10 text-white rounded-tl-sm"
                  )}>
                    {msg.message}
                  </div>
                  <span className="text-[9px] text-white/30 mt-1 px-1">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input Chat */}
      <div className="flex-none p-3 border-t border-white/5 bg-[#0a0a0e]">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={250}
            placeholder="Ketik pesan..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand/50 transition-colors"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || sending}
            className="w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
          </button>
        </form>
      </div>
    </div>
  )
}
