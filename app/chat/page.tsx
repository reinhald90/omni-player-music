'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { usePlayerStore } from '@/store/playerStore'
import { Send, BadgeCheck, MessageSquare, Loader2, Users, Crown, ArrowDown, Smile, Globe2, Sparkles, X, Paperclip, CornerUpLeft } from 'lucide-react'
import { clsx } from 'clsx'

interface ChatMessage {
  id: string; user_id: string; user_name: string; user_avatar: string | null; is_verified: boolean;
  message: string; created_at: string; role: string | null; role_color: string | null;
  reply_to_id: string | null; reply_to_name: string | null; reply_to_message: string | null; media_url: string | null; media_type: string | null;
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
    try { const res = await fetch('/api/db/chat/stats'); const json = await res.json(); if (json.success) setStats({ total: json.totalUsers, online: json.onlineUsers }) } catch (e) {}
  }

  const fetchMessages = async (isFirstLoad = false) => {
    if (!user) return
    try {
      const res = await fetch(`/api/db/chat?uid=${user.id}`)
      const json = await res.json()
      if (json.success) { setMessages(json.data); if (isFirstLoad) setTimeout(() => scrollToBottom('auto'), 100) }
    } catch (e) {} finally { if (isFirstLoad) setLoading(false) }
  }

  useEffect(() => {
    if (!isAuthenticated || !user) return
    fetchMessages(true); fetchStats()
    const interval = setInterval(() => { fetchMessages(false); fetchStats() }, 3000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user])

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => { bottomRef.current?.scrollIntoView({ behavior }); setUnread(0) }
  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isBottom = scrollHeight - scrollTop - clientHeight < 60
    setIsScrolledToBottom(isBottom); if (isBottom && unread > 0) setUnread(0)
  }

  useEffect(() => { if (isScrolledToBottom) scrollToBottom() }, [messages, isScrolledToBottom])
  useEffect(() => {
    if (messages.length > prevLenRef.current && prevLenRef.current > 0 && !isScrolledToBottom) setUnread((prev) => prev + (messages.length - prevLenRef.current))
    prevLenRef.current = messages.length
  }, [messages, isScrolledToBottom])

  useEffect(() => { const el = textareaRef.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px' }, [input])
  useEffect(() => {
    if (!showEmoji) return
    const handler = (e: MouseEvent) => { if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false) }
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler)
  }, [showEmoji])

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 10 * 1024 * 1024) return alert('File maksimal 10MB')
    setUploadingMedia(true)
    try {
      const formData = new FormData(); formData.append('file', file); formData.append('type', 'chat_media')
      const res = await fetch('/api/upload', { method: 'POST', body: formData }); const json = await res.json()
      if (json.success) setSelectedMedia({ url: json.url, type: file.type.startsWith('video') ? 'video' : 'image' }); else alert('Gagal upload')
    } catch (err) { alert('Error upload') } finally { setUploadingMedia(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!input.trim() && !selectedMedia) || !user || sending) return

    setSending(true)
    const msgText = input.trim(); const mediaUrl = selectedMedia?.url || null; const mediaType = selectedMedia?.type || null
    setInput(''); setSelectedMedia(null); const currentReply = replyTo; setReplyTo(null); setShowEmoji(false)

    const tempMsg: ChatMessage = {
      id: 'temp-' + Date.now(), user_id: user.id, user_name: user.name, user_avatar: user.avatar || null,
      is_verified: user.isVerified || false, message: msgText, created_at: new Date().toISOString(),
      role: user.role || 'user', role_color: (user as any).roleColor || '#ffffff',
      reply_to_id: currentReply?.id || null, reply_to_name: currentReply?.user_name || null, reply_to_message: currentReply?.message || null,
      media_url: mediaUrl, media_type: mediaType
    }
    setMessages((prev) => [...prev, tempMsg]); scrollToBottom()

    try {
      await fetch('/api/db/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid: user.id, name: user.name, avatar: user.avatar, isVerified: user.isVerified, message: msgText, replyToId: currentReply?.id, replyToName: currentReply?.user_name, replyToMessage: currentReply?.message, mediaUrl, mediaType }) })
      fetchMessages(false)
    } catch { setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id)); alert('Gagal kirim') } finally { setSending(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  if (!initialized || !user) return null

  return (
    <div className="fixed inset-0 top-16 bottom-0 flex flex-col max-w-4xl mx-auto bg-[#050505] z-40 overflow-hidden">
      
      {/* Header Solid */}
      <div className="relative flex-none px-4 py-3 border-b border-white/5 bg-[#0a0a0a] z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center"><Globe2 size={18} className="text-white" /></div>
            <div>
              <h1 className="text-sm font-black text-white flex items-center gap-1.5">Obrolan Global</h1>
              <p className="text-[10px] text-white/40">Ngobrol santai bareng pengguna</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-white/5">
             <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-emerald-400">{stats.online}</span></div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1"><Users size={11} className="text-white/40" /><span className="text-[10px] font-bold text-white/60">{stats.total}</span></div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={containerRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-2">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white" /></div> : messages.map((msg, idx) => {
          const isMe = msg.user_id === user.id; const isOwner = msg.role === 'owner'; const roleColor = msg.role_color || '#ffffff'
          const prevMsg = messages[idx - 1]; const isGrouped = prevMsg && prevMsg.user_id === msg.user_id && (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 300000)

          return (
            <div key={msg.id} className={clsx("flex gap-2.5 group", isMe ? "flex-row-reverse" : "flex-row", isGrouped ? "mt-1" : "mt-4")}>
              
              {!isGrouped ? (
                <Link href={`/user/${msg.user_id}`} className="relative flex-none z-10 hover:scale-105 transition-transform">
                  <div className={clsx("relative w-9 h-9 rounded-full", isOwner && "shadow-[0_0_10px_rgba(245,158,11,0.3)]")}>
                    {isOwner && <div className="absolute -inset-[2px] rounded-full bg-[conic-gradient(from_0deg,transparent_0%,#f59e0b_20%,#fbbf24_50%,transparent_80%)] animate-[spin_3s_linear_infinite]" />}
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-[#1a1a1a] flex items-center justify-center text-white text-[11px] font-black border-2 border-[#050505]">
                      {msg.user_avatar ? <img src={msg.user_avatar} alt="" className="w-full h-full object-cover" /> : msg.user_name.charAt(0).toUpperCase()}
                    </div>
                    {isOwner && <Crown size={12} className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-amber-400 fill-amber-400 drop-shadow-md" />}
                  </div>
                </Link>
              ) : <div className="w-9 flex-none" />}

              <div className={clsx("max-w-[80%] flex flex-col relative", isMe ? "items-end" : "items-start")}>
                
                {!isGrouped && (
                  <div className={clsx("flex items-center gap-1.5 mb-1 px-1", isMe && "flex-row-reverse")}>
                    <Link href={`/user/${msg.user_id}`} className="text-[11px] text-white/50 font-bold hover:text-white">{isMe ? 'Kamu' : msg.user_name}</Link>
                    {msg.is_verified && <BadgeCheck size={12} className="text-blue-500" />}
                    {msg.role !== 'user' && <span style={{ color: roleColor, backgroundColor: roleColor + '15', borderColor: roleColor + '30' }} className="text-[8px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded border">{msg.role}</span>}
                  </div>
                )}

                {msg.media_url && (
                  <div className="mb-1.5 rounded-lg overflow-hidden border border-white/10 max-w-[240px]">
                    {msg.media_type === 'video' ? <video src={msg.media_url} controls className="w-full h-auto bg-black" /> : <img src={msg.media_url} alt="media" className="w-full h-auto object-cover" onClick={() => window.open(msg.media_url!, '_blank')} />}
                  </div>
                )}

                <div className={clsx("relative px-3.5 py-2 text-[13.5px] leading-relaxed break-words whitespace-pre-wrap", isMe ? "bg-white text-black rounded-2xl rounded-tr-sm" : "bg-[#1a1a1a] text-white border border-white/5 rounded-2xl rounded-tl-sm")}>
                  {msg.reply_to_id && (
                    <div className="mb-2 p-2 rounded bg-black/10 border-l-2 border-black/30 flex flex-col cursor-pointer">
                      <span className="text-[10px] font-bold text-black/60">{msg.reply_to_name}</span>
                      <span className="text-[11px] text-black/40 truncate">{msg.reply_to_message || 'Media'}</span>
                    </div>
                  )}
                  {msg.message}
                </div>

                <div className={clsx("flex items-center gap-2 mt-0.5 px-1", isMe && "flex-row-reverse")}>
                  <span className="text-[9px] text-white/30 tabular-nums">{formatTime(msg.created_at)}</span>
                  <button onClick={() => { setReplyTo(msg); textareaRef.current?.focus() }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/40 hover:text-white"><CornerUpLeft size={12} /></button>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} className="h-2" />
      </div>

      {!isScrolledToBottom && (
        <button onClick={() => scrollToBottom()} className="absolute bottom-24 right-4 z-20 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
          <ArrowDown size={18} />
          {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center border-2 border-white">{unread}</span>}
        </button>
      )}

      {/* Input Area Solid */}
      <div className="relative flex-none border-t border-white/5 bg-[#0a0a0a] z-20">
        {replyTo && (
          <div className="flex items-center justify-between p-2.5 mx-3 mt-2 bg-[#1a1a1a] rounded-lg border-l-2 border-white">
            <div className="min-w-0"><div className="text-[10px] font-bold text-white/80 mb-0.5 flex items-center gap-1"><CornerUpLeft size={10}/> Membalas {replyTo.user_name}</div><div className="text-xs text-white/40 truncate">{replyTo.message || 'Media'}</div></div>
            <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/10 rounded-full text-white/40"><X size={14}/></button>
          </div>
        )}

        {selectedMedia && (
          <div className="flex items-start gap-2 p-3 mx-3 mt-2 bg-[#1a1a1a] rounded-lg border border-white/5">
            {selectedMedia.type === 'video' ? <video src={selectedMedia.url} className="w-16 h-16 object-cover rounded bg-black" /> : <img src={selectedMedia.url} className="w-16 h-16 object-cover rounded" />}
            <div className="flex-1 min-w-0 pt-1"><div className="text-[10px] font-bold text-white mb-1">Media siap dikirim</div><div className="text-[10px] text-white/40">Tambahkan teks jika perlu.</div></div>
            <button onClick={() => setSelectedMedia(null)} className="p-1 hover:bg-white/10 rounded-full text-white/40"><X size={14}/></button>
          </div>
        )}

        <form onSubmit={sendMessage} className="flex items-end gap-2 p-3">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia} className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-white/60 hover:bg-white/10 transition-all flex-none">
            {uploadingMedia ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>
          <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleMediaUpload} className="hidden" />

          <div className="relative" ref={emojiRef}>
            <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-white/60 hover:bg-white/10 transition-all flex-none"><Smile size={18} /></button>
            {showEmoji && (
              <div className="absolute bottom-12 left-0 w-[260px] p-2 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl z-30 grid grid-cols-8 gap-1">
                {EMOJIS.map(em => <button key={em} type="button" onClick={() => { setInput(p => p + em); textareaRef.current?.focus() }} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-lg">{em}</button>)}
              </div>
            )}
          </div>

          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} maxLength={500} rows={1} placeholder="Ketik pesan..." className="flex-1 bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 resize-none max-h-[120px] leading-relaxed" />

          <button type="submit" disabled={(!input.trim() && !selectedMedia) || sending} className={clsx("w-11 h-11 rounded-xl flex items-center justify-center flex-none transition-all active:scale-95", (input.trim() || selectedMedia) && !sending ? "bg-white text-black shadow-lg" : "bg-[#1a1a1a] text-white/20 cursor-not-allowed")}>
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  )
}
