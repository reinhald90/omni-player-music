'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { usePlayerStore } from '@/store/playerStore'
import { 
  Send, 
  BadgeCheck, 
  Loader2, 
  Users, 
  Crown, 
  ArrowDown, 
  Smile, 
  Hash, 
  X, 
  Paperclip, 
  CornerUpLeft,
  MessageSquare
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
  reply_to_id: string | null
  reply_to_name: string | null
  reply_to_message: string | null
  media_url: string | null
  media_type: string | null
}

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
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<{ url: string, type: string } | null>(null)
  const [unread, setUnread] = useState(0)

  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevLenRef = useRef(0)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)

  useEffect(() => {
    if (initialized && !isAuthenticated) router.push('/')
    setHideMiniPlayer(true)
    return () => setHideMiniPlayer(false)
  }, [initialized, isAuthenticated, router, setHideMiniPlayer])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/db/chat/stats')
      const json = await res.json()
      if (json.success) setStats({ total: json.totalUsers, online: json.onlineUsers })
    } catch (e) {}
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
    } catch (e) {} finally {
      if (isFirstLoad) setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !user) return
    fetchMessages(true)
    fetchStats()
    const interval = setInterval(() => {
      fetchMessages(false)
      fetchStats()
    }, 3000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user])

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

  useEffect(() => {
    if (messages.length > prevLenRef.current && prevLenRef.current > 0 && !isScrolledToBottom) {
      setUnread((prev) => prev + (messages.length - prevLenRef.current))
    }
    prevLenRef.current = messages.length
  }, [messages, isScrolledToBottom])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  useEffect(() => {
    if (!showEmoji) return
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmoji])

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return alert('Ukuran file maksimal 10MB')
    setUploadingMedia(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'chat_media')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.success) {
        setSelectedMedia({ url: json.url, type: file.type.startsWith('video') ? 'video' : 'image' })
      } else {
        alert('Gagal mengunggah media')
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengunggah')
    } finally {
      setUploadingMedia(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!input.trim() && !selectedMedia) || !user || sending) return

    setSending(true)
    const msgText = input.trim()
    const mediaUrl = selectedMedia?.url || null
    const mediaType = selectedMedia?.type || null
    setInput('')
    setSelectedMedia(null)
    const currentReply = replyTo
    setReplyTo(null)
    setShowEmoji(false)

    const tempMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      user_id: user.id,
      user_name: user.name,
      user_avatar: user.avatar || null,
      is_verified: user.isVerified || false,
      message: msgText,
      created_at: new Date().toISOString(),
      role: user.role || 'user',
      role_color: (user as any).roleColor || '#a1a1aa',
      reply_to_id: currentReply?.id || null,
      reply_to_name: currentReply?.user_name || null,
      reply_to_message: currentReply?.message || null,
      media_url: mediaUrl,
      media_type: mediaType
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
          message: msgText,
          replyToId: currentReply?.id,
          replyToName: currentReply?.user_name,
          replyToMessage: currentReply?.message,
          mediaUrl,
          mediaType
        })
      })
      fetchMessages(false)
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      alert('Gagal mengirim pesan')
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

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  const formatDateBadge = (d: string) => {
    const date = new Date(d)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Hari ini'
    if (date.toDateString() === yesterday.toDateString()) return 'Kemarin'
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (!initialized || !user) return null

  return (
    <div className="fixed inset-0 top-16 bottom-0 flex flex-col max-w-5xl mx-auto bg-[#09090b] border-x border-zinc-800/60 z-40 overflow-hidden antialiased selection:bg-zinc-700 selection:text-white">
      
      {/* Top Bar - Enterprise Channel Style */}
      <header className="flex-none h-14 px-5 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 flex-none">
            <Hash size={16} strokeWidth={2.2} />
          </div>
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-[14px] font-semibold text-zinc-100 tracking-tight truncate">
              general-discussion
            </h1>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-zinc-700 flex-none" />
            <p className="hidden sm:block text-xs text-zinc-500 truncate">
              Ruang komunikasi dan diskusi publik
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-none">
          <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800/80 px-3 py-1 rounded-md text-xs">
            <div className="flex items-center gap-1.5" title="Pengguna Aktif">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-zinc-200 tabular-nums">{stats.online}</span>
              <span className="text-zinc-500 hidden md:inline">online</span>
            </div>
            <div className="w-px h-3 bg-zinc-800" />
            <div className="flex items-center gap-1.5 text-zinc-400" title="Total Anggota">
              <Users size={12} className="text-zinc-500" />
              <span className="font-medium tabular-nums">{stats.total}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Feed */}
      <div 
        ref={containerRef} 
        onScroll={handleScroll} 
        className="relative flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1 scroll-smooth"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500">
            <Loader2 size={20} className="animate-spin text-zinc-400" />
            <span className="text-xs font-medium">Memuat percakapan...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
              <MessageSquare size={20} />
            </div>
            <p className="text-sm font-medium text-zinc-300">Belum ada percakapan</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              Mulai diskusi pertama di kanal ini.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user_id === user.id
            const isOwner = msg.role === 'owner'
            const roleColor = msg.role_color || '#a1a1aa'
            const prevMsg = messages[idx - 1]
            
            const currentDateStr = new Date(msg.created_at).toDateString()
            const prevDateStr = prevMsg ? new Date(prevMsg.created_at).toDateString() : null
            const showDateSeparator = currentDateStr !== prevDateStr

            const isGrouped = 
              !showDateSeparator &&
              prevMsg && 
              prevMsg.user_id === msg.user_id && 
              (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 300000)

            return (
              <div key={msg.id}>
                {/* Date Divider */}
                {showDateSeparator && (
                  <div className="flex items-center gap-3 my-6 select-none">
                    <div className="flex-1 h-px bg-zinc-800/70" />
                    <span className="text-[11px] font-medium text-zinc-500 px-2.5 py-0.5 rounded-md bg-zinc-900/80 border border-zinc-800/80">
                      {formatDateBadge(msg.created_at)}
                    </span>
                    <div className="flex-1 h-px bg-zinc-800/70" />
                  </div>
                )}

                <div className={clsx(
                  "flex gap-3 group relative",
                  isMe ? "flex-row-reverse" : "flex-row",
                  isGrouped ? "mt-0.5" : "mt-5"
                )}>
                  {/* Avatar Column */}
                  {!isGrouped ? (
                    <Link 
                      href={`/user/${msg.user_id}`} 
                      className="relative flex-none mt-0.5 self-start transition-opacity hover:opacity-85"
                    >
                      <div className={clsx(
                        "w-8 h-8 rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center text-zinc-200 text-xs font-semibold border",
                        isOwner ? "border-amber-500/60" : "border-zinc-800"
                      )}>
                        {msg.user_avatar ? (
                          <img src={msg.user_avatar} alt={msg.user_name} className="w-full h-full object-cover" />
                        ) : (
                          msg.user_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      {isOwner && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-950 border border-amber-500/50 flex items-center justify-center">
                          <Crown size={8} className="text-amber-400 fill-amber-400" />
                        </div>
                      )}
                    </Link>
                  ) : (
                    <div className="w-8 flex-none" />
                  )}

                  {/* Content Column */}
                  <div className={clsx(
                    "max-w-[82%] sm:max-w-[70%] flex flex-col",
                    isMe ? "items-end" : "items-start"
                  )}>
                    {/* Metadata Header */}
                    {!isGrouped && (
                      <div className={clsx(
                        "flex items-center gap-1.5 mb-1 px-0.5",
                        isMe && "flex-row-reverse"
                      )}>
                        <Link 
                          href={`/user/${msg.user_id}`} 
                          className="text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                        >
                          {isMe ? 'Anda' : msg.user_name}
                        </Link>
                        
                        {msg.is_verified && (
                          <BadgeCheck size={13} className="text-sky-400 flex-none" />
                        )}

                        {msg.role && msg.role !== 'user' && (
                          <span 
                            style={{ 
                              color: roleColor, 
                              backgroundColor: `${roleColor}12`, 
                              borderColor: `${roleColor}30` 
                            }} 
                            className="text-[10px] font-medium px-1.5 py-0.2 rounded border leading-tight capitalize"
                          >
                            {msg.role}
                          </span>
                        )}

                        <span className="text-[10px] text-zinc-500 tabular-nums">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    )}

                    {/* Media Attachment */}
                    {msg.media_url && (
                      <div className="mb-1.5 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 max-w-[280px] sm:max-w-[320px]">
                        {msg.media_type === 'video' ? (
                          <video src={msg.media_url} controls className="w-full max-h-[260px] bg-black" />
                        ) : (
                          <img 
                            src={msg.media_url} 
                            alt="Lampiran" 
                            className="w-full max-h-[260px] object-cover cursor-pointer hover:opacity-95 transition-opacity" 
                            onClick={() => window.open(msg.media_url!, '_blank')} 
                          />
                        )}
                      </div>
                    )}

                    {/* Message Bubble + Hover Action */}
                    {msg.message && (
                      <div className={clsx(
                        "flex items-center gap-1.5",
                        isMe ? "flex-row-reverse" : "flex-row"
                      )}>
                        <div className={clsx(
                          "relative px-3.5 py-2 text-[13.5px] leading-relaxed break-words whitespace-pre-wrap rounded-xl",
                          isMe 
                            ? "bg-zinc-100 text-zinc-950 rounded-tr-sm font-normal" 
                            : "bg-zinc-900 text-zinc-100 border border-zinc-800/90 rounded-tl-sm"
                        )}>
                          {/* Quoted Reply Box */}
                          {msg.reply_to_id && (
                            <div className={clsx(
                              "mb-2 pl-2.5 pr-2 py-1.5 rounded-md border-l-2 text-xs flex flex-col",
                              isMe 
                                ? "bg-zinc-200/70 border-zinc-500 text-zinc-900" 
                                : "bg-zinc-950/60 border-zinc-600 text-zinc-300"
                            )}>
                              <span className={clsx(
                                "text-[11px] font-semibold leading-snug",
                                isMe ? "text-zinc-900" : "text-zinc-200"
                              )}>
                                {msg.reply_to_name}
                              </span>
                              <span className={clsx(
                                "text-[11px] truncate mt-0.5",
                                isMe ? "text-zinc-600" : "text-zinc-400"
                              )}>
                                {msg.reply_to_message || 'Lampiran media'}
                              </span>
                            </div>
                          )}

                          <span>{msg.message}</span>
                        </div>

                        {/* Quick Reply Button */}
                        <button
                          onClick={() => {
                            setReplyTo(msg)
                            textareaRef.current?.focus()
                          }}
                          title="Balas pesan"
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 flex-none"
                        >
                          <CornerUpLeft size={13} />
                        </button>
                      </div>
                    )}

                    {/* Timestamp for grouped messages on hover */}
                    {isGrouped && (
                      <span className="text-[10px] text-zinc-600 tabular-nums mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(msg.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {!isScrolledToBottom && (
        <button 
          onClick={() => scrollToBottom()} 
          className="absolute bottom-24 right-5 z-20 h-9 px-3 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 flex items-center gap-1.5 shadow-lg transition-all text-xs font-medium"
        >
          <ArrowDown size={14} />
          <span>Terbaru</span>
          {unread > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-950 text-[10px] font-bold">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Composer Footer */}
      <div className="flex-none p-3 sm:p-4 bg-[#09090b] border-t border-zinc-800/80 z-20">
        <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 focus-within:border-zinc-700 transition-colors">
          
          {/* Active Reply Banner */}
          {replyTo && (
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-800/80 bg-zinc-950/40 rounded-t-xl">
              <div className="flex items-center gap-2 min-w-0 text-xs">
                <CornerUpLeft size={13} className="text-zinc-400 flex-none" />
                <span className="text-zinc-400 flex-none">Membalas</span>
                <span className="font-semibold text-zinc-200 truncate">{replyTo.user_name}</span>
                <span className="text-zinc-600">—</span>
                <span className="text-zinc-500 truncate">{replyTo.message || 'Lampiran media'}</span>
              </div>
              <button 
                type="button"
                onClick={() => setReplyTo(null)} 
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded-md hover:bg-zinc-800/60 transition-colors flex-none ml-2"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Selected Media Preview */}
          {selectedMedia && (
            <div className="flex items-center justify-between p-3 border-b border-zinc-800/80 bg-zinc-950/30">
              <div className="flex items-center gap-3 min-w-0">
                {selectedMedia.type === 'video' ? (
                  <video src={selectedMedia.url} className="w-12 h-12 object-cover rounded-lg border border-zinc-800 bg-black flex-none" />
                ) : (
                  <img src={selectedMedia.url} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-zinc-800 flex-none" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-medium text-zinc-200">Lampiran siap dikirim</div>
                  <div className="text-[11px] text-zinc-500 truncate">Tambahkan keterangan atau langsung kirim</div>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedMedia(null)} 
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input Row */}
          <form onSubmit={sendMessage} className="flex items-end gap-1.5 p-2">
            <input 
              type="file" 
              accept="image/*,video/*" 
              ref={fileInputRef} 
              onChange={handleMediaUpload} 
              className="hidden" 
            />
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploadingMedia} 
              title="Lampirkan file"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 transition-colors flex-none disabled:opacity-50"
            >
              {uploadingMedia ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </button>

            <div className="relative flex-none" ref={emojiRef}>
              <button 
                type="button" 
                onClick={() => setShowEmoji(!showEmoji)} 
                title="Sisipkan emoji"
                className={clsx(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                  showEmoji ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70"
                )}
              >
                <Smile size={16} />
              </button>

              {showEmoji && (
                <div className="absolute bottom-11 left-0 w-[264px] p-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl z-30 grid grid-cols-6 gap-1">
                  {EMOJIS.map((em) => (
                    <button 
                      key={em} 
                      type="button" 
                      onClick={() => {
                        setInput((p) => p + em)
                        textareaRef.current?.focus()
                      }} 
                      className="h-9 flex items-center justify-center hover:bg-zinc-800 rounded-lg text-base transition-colors"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea 
              ref={textareaRef} 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={handleKeyDown} 
              maxLength={500} 
              rows={1} 
              placeholder="Kirim pesan ke #general-discussion..." 
              className="flex-1 bg-transparent px-2 py-2 text-[13.5px] text-zinc-100 placeholder:text-zinc-500 outline-none resize-none max-h-[120px] leading-relaxed" 
            />

            <button 
              type="submit" 
              disabled={(!input.trim() && !selectedMedia) || sending} 
              className={clsx(
                "h-9 px-3 rounded-lg flex items-center justify-center gap-1.5 flex-none text-xs font-medium transition-all",
                (input.trim() || selectedMedia) && !sending 
                  ? "bg-zinc-100 text-zinc-950 hover:bg-white shadow-sm" 
                  : "bg-zinc-800/60 text-zinc-600 cursor-not-allowed"
              )}
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Kirim</span>
                  <Send size={13} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
