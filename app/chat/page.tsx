'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { usePlayerStore } from '@/store/playerStore'
import {
  Send, BadgeCheck, MessageSquare, Loader2, Users, Crown,
  ArrowDown, Smile, Globe2, Sparkles, X,
} from 'lucide-react'
import { clsx } from 'clsx'

interface ChatMessage {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  is_verified: boolean
  message: string
  created_at: string
  role: string | null
  role_color: string | null
}

type GroupedItem =
  | { type: 'date'; key: string; label: string }
  | { type: 'message'; key: string; msg: ChatMessage; isFirst: boolean; isLast: boolean }

const EMOJIS = ['😀','😂','🥰','😍','😎','🤔','😭','🔥','❤️','👍','👎','🎉','✨','💯','🙏','👏','💪','🚀','🎵','🎧','☕','🌙','⭐','🫶']

export default function GlobalChatPage() {
  const router = useRouter()
  const { user, initialized, isAuthenticated } = useAuthStore()
  const setHideMiniPlayer = usePlayerStore((s) => s.setHideMiniPlayer)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, online: 0 })
  const [showEmoji, setShowEmoji] = useState(false)
  const [unread, setUnread] = useState(0)

  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const prevLenRef = useRef(0)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)

  // ====== Auth & Player hide ======
  useEffect(() => {
    if (initialized && !isAuthenticated) router.push('/')
    setHideMiniPlayer(true)
    return () => setHideMiniPlayer(false)
  }, [initialized, isAuthenticated, router, setHideMiniPlayer])

  // ====== Data fetching ======
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/db/chat/stats')
      const json = await res.json()
      if (json.success) setStats({ total: json.totalUsers, online: json.onlineUsers })
    } catch (e) { console.error(e) }
  }

  const fetchMessages = async (isFirstLoad = false) => {
    if (!user) return
    try {
      const res = await fetch(`/api/db/chat?uid=${user.id}`)
      const json = await res.json()
      if (json.success) {
        setMessages(json.data)
        if (isFirstLoad) setTimeout(() => scrollToBottom('auto'), 100)
      }
    } catch (e) { console.error(e) }
    finally { if (isFirstLoad) setLoading(false) }
  }

  useEffect(() => {
    if (!isAuthenticated || !user) return
    fetchMessages(true)
    fetchStats()
    const interval = setInterval(() => { fetchMessages(false); fetchStats() }, 3000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user])

  // ====== Scroll logic ======
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
    setUnread(0)
  }

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isBottom = scrollHeight - scrollTop - clientHeight < 60
    setIsScrolledToBottom(isBottom)
    if (isBottom && unread > 0) setUnread(0)
  }

  useEffect(() => {
    if (isScrolledToBottom) scrollToBottom()
  }, [messages, isScrolledToBottom])

  // Track unread badge
  useEffect(() => {
    if (messages.length > prevLenRef.current && prevLenRef.current > 0 && !isScrolledToBottom) {
      setUnread((prev) => prev + (messages.length - prevLenRef.current))
    }
    prevLenRef.current = messages.length
  }, [messages, isScrolledToBottom])

  // ====== Textarea auto-resize ======
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmoji) return
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmoji])

  // ====== Send message ======
  const sendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault()
    if (!input.trim() || !user || sending) return

    setSending(true)
    const msgToSend = input.trim()
    setInput('')
    setShowEmoji(false)

    const tempMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      user_id: user.id,
      user_name: user.name,
      user_avatar: user.avatar || null,
      is_verified: user.isVerified || false,
      message: msgToSend,
      created_at: new Date().toISOString(),
      role: user.role || 'user',
      role_color: (user as any).roleColor || '#ff2d55',
    }
    setMessages((prev) => [...prev, tempMsg])
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
          message: msgToSend,
        }),
      })
      fetchMessages(false)
    } catch {
      // rollback optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      setInput(msgToSend)
      alert('Gagal kirim pesan, coba lagi.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  // ====== Helpers ======
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  const formatDateLabel = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'Hari Ini'
    if (date.toDateString() === yesterday.toDateString()) return 'Kemarin'
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // ====== Group + date separators ======
  const groupedItems = useMemo<GroupedItem[]>(() => {
    const items: GroupedItem[] = []
    let lastDate = ''
    let lastUserId = ''
    let lastTime = 0
    const GROUP_WINDOW = 5 * 60 * 1000

    messages.forEach((msg, idx) => {
      const d = new Date(msg.created_at)
      const dateStr = d.toDateString()
      const t = d.getTime()

      if (dateStr !== lastDate) {
        items.push({ type: 'date', key: 'date-' + dateStr, label: formatDateLabel(d) })
        lastDate = dateStr
        lastUserId = ''
      }

      const sameGroup = lastUserId === msg.user_id && t - lastTime < GROUP_WINDOW
      const next = messages[idx + 1]
      const isLast =
        !next ||
        next.user_id !== msg.user_id ||
        new Date(next.created_at).getTime() - t >= GROUP_WINDOW ||
        new Date(next.created_at).toDateString() !== dateStr

      items.push({ type: 'message', key: msg.id, msg, isFirst: !sameGroup, isLast })

      lastUserId = msg.user_id
      lastTime = t
    })
    return items
  }, [messages])

  if (!initialized || !user) return null

  const charCount = input.length
  const nearLimit = charCount > 220

  return (
    <div className="fixed inset-0 top-16 bottom-0 flex flex-col max-w-4xl mx-auto bg-[#050505] z-40 overflow-hidden">

      {/* ===== Ambient animated background ===== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-brand/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-fuchsia-500/10 blur-3xl animate-pulse [animation-delay:1.5s]" />
      </div>

      {/* ===== Header ===== */}
      <div className="relative flex-none px-4 py-3 border-b border-white/5 bg-[#0a0a0e]/80 backdrop-blur-xl z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-none">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand to-fuchsia-600 flex items-center justify-center shadow-lg shadow-brand/30">
                <Globe2 size={18} className="text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0a0e] animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white flex items-center gap-1.5">
                Obrolan Global
                <Sparkles size={12} className="text-amber-400" />
              </h1>
              <p className="text-[10px] text-white/40 truncate">Ngobrol bareng semua pengguna</p>
            </div>
          </div>

          {/* Statistik */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold text-emerald-400 tabular-nums">{stats.online}</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1">
              <Users size={11} className="text-white/40" />
              <span className="text-[10px] font-bold text-white/60 tabular-nums">{stats.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Messages area ===== */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-1 scroll-smooth"
      >
        {loading ? (
          <div className="space-y-4 mt-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2.5 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-white/5 flex-none" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-20 bg-white/5 rounded" />
                  <div className="h-9 bg-white/5 rounded-2xl" style={{ width: `${45 + (i * 13) % 40}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand/20 to-fuchsia-500/10 border border-brand/20 flex items-center justify-center mb-4">
              <MessageSquare size={32} className="text-brand" />
            </div>
            <p className="text-white font-bold text-sm">Belum ada pesan</p>
            <p className="text-white/40 text-xs mt-1 max-w-[240px]">Jadilah yang pertama menyapa! 👋</p>
          </div>
        ) : (
          groupedItems.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.key} className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    {item.label}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
                </div>
              )
            }

            const { msg, isFirst, isLast } = item
            const isMe = msg.user_id === user.id
            const isOwner = msg.role === 'owner'
            const roleColor = msg.role_color || (isOwner ? '#f59e0b' : '#ff2d55')

            return (
              <div
                key={item.key}
                className={clsx(
                  'flex gap-2.5 transition-opacity',
                  isMe ? 'flex-row-reverse' : 'flex-row',
                  isFirst ? 'mt-3' : 'mt-0.5'
                )}
              >
                {/* Avatar */}
                {isFirst ? (
                  <Link
                    href={`/user/${msg.user_id}`}
                    className="relative flex-none z-10 transition-transform hover:scale-105 active:scale-95"
                  >
                    <div className={clsx(
                      'relative w-9 h-9 rounded-full',
                      isOwner && 'shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    )}>
                      {isOwner && (
                        <div className="absolute -inset-[2px] rounded-full bg-[conic-gradient(from_0deg,transparent_0%,#f59e0b_20%,#fbbf24_50%,transparent_80%)] animate-[spin_3s_linear_infinite]" />
                      )}
                      <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-[11px] font-black border-2 border-[#0a0a0e]">
                        {msg.user_avatar ? (
                          <img src={msg.user_avatar} alt={msg.user_name} className="w-full h-full object-cover" />
                        ) : (
                          msg.user_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      {isOwner && (
                        <Crown size={12} className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-amber-400 fill-amber-400 drop-shadow-md" />
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="w-9 flex-none" />
                )}

                {/* Bubble column */}
                <div className={clsx('max-w-[78%] flex flex-col', isMe ? 'items-end' : 'items-start')}>
                  {isFirst && (
                    <div className={clsx('flex items-center gap-1 mb-1 px-1', isMe && 'flex-row-reverse')}>
                      <Link
                        href={`/user/${msg.user_id}`}
                        className="text-[10px] text-white/40 font-bold hover:text-brand transition-colors"
                      >
                        {isMe ? 'Kamu' : msg.user_name}
                      </Link>
                      {msg.is_verified && <BadgeCheck size={11} className="text-blue-500" />}
                      {msg.role && msg.role !== 'user' && (
                        <span
                          style={{ color: roleColor, backgroundColor: roleColor + '15', borderColor: roleColor + '30' }}
                          className="text-[8px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded border"
                        >
                          {msg.role}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={clsx(
                    'relative px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap',
                    isMe
                      ? 'bg-gradient-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/20'
                      : 'bg-white/[0.07] text-white/95 border border-white/[0.06] backdrop-blur-sm',
                    isMe
                      ? isLast ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl'
                      : isLast ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl'
                  )}>
                    {msg.message}
                  </div>

                  {isLast && (
                    <span className="text-[9px] text-white/30 mt-1 px-1 tabular-nums">
                      {formatTime(msg.created_at)}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ===== Scroll to bottom FAB ===== */}
      {!isScrolledToBottom && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-4 z-20 w-11 h-11 rounded-full bg-gradient-to-br from-brand to-fuchsia-600 text-white flex items-center justify-center shadow-xl shadow-brand/40 active:scale-95 transition-transform animate-in fade-in slide-in-from-bottom-2"
          aria-label="Scroll ke pesan terbaru"
        >
          <ArrowDown size={18} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center border-2 border-[#050505]">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      )}

      {/* ===== Input area ===== */}
      <div className="relative flex-none border-t border-white/5 bg-[#0a0a0e]/80 backdrop-blur-xl pb-safe z-20">
        {nearLimit && (
          <div className="absolute -top-6 right-4 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            {charCount}/250
          </div>
        )}

        <form onSubmit={sendMessage} className="flex items-end gap-2 p-3">
          {/* Emoji picker */}
          <div className="relative" ref={emojiRef}>
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className={clsx(
                'w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95',
                showEmoji
                  ? 'bg-brand/20 text-brand border border-brand/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              )}
              aria-label="Emoji"
            >
              {showEmoji ? <X size={18} /> : <Smile size={18} />}
            </button>

            {showEmoji && (
              <div className="absolute bottom-14 left-0 w-[280px] p-2 rounded-2xl bg-[#0f0f14] border border-white/10 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => { setInput((p) => p + em); textareaRef.current?.focus() }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition text-lg"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={250}
              rows={1}
              placeholder="Ketik pesan..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20 transition-all resize-none max-h-[120px] leading-relaxed"
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className={clsx(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95',
              input.trim() && !sending
                ? 'bg-gradient-to-br from-brand to-fuchsia-600 text-white shadow-lg shadow-brand/30'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
            aria-label="Kirim"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} className="ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  )
}
