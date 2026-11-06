'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/store/authStore'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { BadgeCheck, ArrowLeft, Play, Music2, Loader2, Calendar, ShieldCheck, Crown, Share2, Pencil, Check, Hash, AtSign } from 'lucide-react'
import type { Song } from '@/types'
import { clsx } from 'clsx'
import DOMPurify from 'isomorphic-dompurify'

const BioRenderer = ({ html, uid = 'pub' }: { html: string, uid?: string }) => {
  const [height, setHeight] = useState(72)
  const channelId = `BIO_PUB_RESIZE_${uid}`

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === channelId && typeof e.data.height === 'number') {
        setHeight(Math.max(56, Math.min(e.data.height, 3000)))
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [channelId])

  if (!html) return null

  // 🛡️ SANITIZE HTML (Mencegah Stored XSS)
  const cleanHtml = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    ADD_TAGS: ['style', 'link', 'iframe'],
    ADD_ATTR: ['target', 'allow', 'allowfullscreen', 'frameborder', 'scrolling']
  })

  const styledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; width: 100%;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #ffffff; background: transparent; overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    #bio-wrapper {
      width: 100%; padding: 16px; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center; gap: 10px;
      word-wrap: break-word; overflow-wrap: break-word;
    }
    a { color: #38bdf8; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
    p { margin: 0; line-height: 1.6; }
    svg { max-width: 100%; height: auto; overflow: visible; display: block; margin: 0 auto; }
    img, video { max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="bio-wrapper">${cleanHtml}</div>
  <script>
    const wrap = document.getElementById('bio-wrapper');
    const updateHeight = () => {
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const scrollH = document.documentElement.scrollHeight;
      const finalH = Math.ceil(Math.max(rect.height, scrollH));
      window.parent.postMessage({ type: '${channelId}', height: finalH }, '*');
    };
    window.addEventListener('load', updateHeight);
    document.querySelectorAll('img, svg, video').forEach(el => {
      el.addEventListener('load', updateHeight);
      el.addEventListener('loadedmetadata', updateHeight);
    });
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(updateHeight).observe(wrap);
    }
    new MutationObserver(updateHeight).observe(wrap, { childList: true, subtree: true, attributes: true, characterData: true });
    setTimeout(updateHeight, 80);
    setTimeout(updateHeight, 350);
    setInterval(updateHeight, 600);
  </script>
</body>
</html>`

  return (
    <iframe
      srcDoc={styledHtml}
      sandbox="allow-scripts allow-popups allow-forms"
      style={{ height: `${height}px` }}
      className="w-full border-0 overflow-hidden transition-[height] duration-200 ease-out block"
      scrolling="no"
      title="User Bio"
    />
  )
}

const resolveUserBorder = (raw?: string | null, isOwner?: boolean, isVerified?: boolean) => {
  const str = (raw || '').trim()
  if (!str) {
    if (isOwner) return { mode: 'gradient', css: 'linear-gradient(135deg, #fde047 0%, #f59e0b 50%, #fef08a 100%)', glow: true }
    if (isVerified) return { mode: 'gradient', css: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 50%, #818cf8 100%)', glow: true }
    return { mode: 'none', css: '#262626', glow: false }
  }
  if (str.startsWith('<svg')) {
    return { mode: 'svg-raw', svg: str, glow: true }
  }
  if (str.includes('url(')) {
    const match = str.match(/url\(\s*(['"]?)(.*?)\1\s*\)/i)
    const innerUrl = match ? match[2] : ''
    if (innerUrl.startsWith('data:image/svg+xml')) {
      try {
        const commaIdx = innerUrl.indexOf(',')
        if (commaIdx !== -1) {
          const payload = innerUrl.slice(commaIdx + 1)
          const decoded = decodeURIComponent(payload)
          if (decoded.trim().startsWith('<svg')) {
            return { mode: 'svg-raw', svg: decoded, glow: true }
          }
        }
      } catch (e) {}
    }
    if (innerUrl) {
      return { mode: 'img-src', src: innerUrl, glow: true }
    }
  }
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:image/')) {
    return { mode: 'img-src', src: str, glow: true }
  }
  if (str.includes('gradient')) {
    return { mode: 'gradient', css: str, glow: true }
  }
  return { mode: 'gradient', css: str, glow: false }
}

const VideoPlayer = ({ src, start = 0, end = 10, className, style }: { src: string, start: number, end: number, className?: string, style?: any }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => { if (videoRef.current) { videoRef.current.currentTime = start; videoRef.current.play().catch(() => {}) } }, [src, start])
  const handleTimeUpdate = () => { if (videoRef.current && videoRef.current.currentTime >= end) videoRef.current.currentTime = start }
  return <video ref={videoRef} src={src} onTimeUpdate={handleTimeUpdate} muted playsInline className={className} style={style} />
}

const MediaRenderer = ({ src, style, className, start = 0, end = 10 }: { src: string, style?: any, className?: string, start?: number, end?: number }) => {
  if (!src) return null
  const isVideo = src.match(/\.(mp4|webm|ogg)$/i)
  if (isVideo) return <VideoPlayer src={src} start={start} end={end} className={className} style={style} />
  return <img src={src} className={className} style={style} alt="media" />
}

interface UserProfile { 
  id: string; idNumber?: number; username?: string; name: string; email: string; avatar: string | null; coverUrl: string | null; bio: string | null; 
  borderStyle?: string; layoutTheme?: string;
  avatarScale?: number; avatarX?: number; avatarY?: number; avatarStart?: number; avatarEnd?: number; 
  coverScale?: number; coverX?: number; coverY?: number; coverStart?: number; coverEnd?: number; 
  isVerified: boolean; role: string; roleColor: string; joinedAt: number; 
}
interface CommunitySong { id: string; user_id: string; uploader_name: string; title: string; artist: string; cover_url: string | null; audio_url: string; created_at: string; }

export default function PublicProfilePage() {
  const params = useParams(); const router = useRouter()
  const rawUid = Array.isArray(params?.uid) ? params.uid[0] : params?.uid
  const uid = rawUid ? decodeURIComponent(rawUid) : ''

  const authUser = useAuthStore((s) => s.user) as any
  const [data, setData] = useState<{ user: UserProfile, songs: CommunitySong[] } | null>(null)
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showId, setShowId] = useState(false) // 🛡️ State untuk sembunyikan ID
  const setCurrent = usePlayerStore((s) => s.setCurrent); const current = usePlayerStore((s) => s.current); const addHistory = useHistoryStore((s) => s.add)

  useEffect(() => {
    if (!uid) return
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/db/users/${encodeURIComponent(uid)}?t=${Date.now()}`, { cache: 'no-store' })
        const json = await res.json()
        if (json.success) setData(json.data)
        else setError(json.error)
      } catch (e: any) {
        setError('Gagal memuat profil')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [uid])

  const handlePlay = (song: CommunitySong) => {
    const playerSong: Song = { id: song.id, title: song.title, artist: song.artist || song.uploader_name, duration: '0:00', durationSec: 0, views: 0, thumbnail: song.cover_url || '/icon.png', url: song.audio_url, audioUrl: song.audio_url }
    setCurrent(playerSong); addHistory(playerSong)
  }

  const handleShare = () => {
    if (typeof window === 'undefined') return
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32} /></div>
  if (error || !data) return <div className="text-center py-20 text-red-400">{error || 'User tidak ditemukan'}</div>

  const { user: dbUser, songs } = data
  const isOwnProfile = authUser?.id === dbUser.id

  const user: UserProfile = isOwnProfile
    ? {
        ...dbUser,
        name: authUser?.name || dbUser.name,
        bio: authUser?.bio ?? dbUser.bio,
        username: authUser?.username ?? dbUser.username,
        idNumber: authUser?.idNumber ?? dbUser.idNumber,
        avatar: authUser?.avatar || dbUser.avatar,
        coverUrl: authUser?.coverUrl || dbUser.coverUrl,
        borderStyle: authUser?.borderStyle || dbUser.borderStyle,
        layoutTheme: authUser?.layoutTheme || dbUser.layoutTheme,
        avatarScale: authUser?.avatarScale ?? dbUser.avatarScale,
        avatarX: authUser?.avatarX ?? dbUser.avatarX,
        avatarY: authUser?.avatarY ?? dbUser.avatarY,
        avatarStart: authUser?.avatarStart ?? dbUser.avatarStart,
        avatarEnd: authUser?.avatarEnd ?? dbUser.avatarEnd,
        coverScale: authUser?.coverScale ?? dbUser.coverScale,
        coverX: authUser?.coverX ?? dbUser.coverX,
        coverY: authUser?.coverY ?? dbUser.coverY,
        coverStart: authUser?.coverStart ?? dbUser.coverStart,
        coverEnd: authUser?.coverEnd ?? dbUser.coverEnd,
      }
    : dbUser

  const joinedDate = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Baru saja'
  const isOwner = user.role === 'owner'
  const roleColor = user.roleColor || (isOwner ? '#f59e0b' : '#ffffff')
  const isMinimalist = user.layoutTheme === 'minimalist'
  const borderInfo = resolveUserBorder(user.borderStyle, isOwner, user.isVerified)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Kembali
        </button>
        <button onClick={handleShare} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all">
          {copied ? <><Check size={13} className="text-emerald-400" /> Link Disalin</> : <><Share2 size={13} /> Bagikan Profil</>}
        </button>
      </div>

      <div className="bg-[#121212] rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
        
        {!isMinimalist && (
          <div className="relative aspect-[21/9] w-full bg-[#1a1a1a] overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <MediaRenderer 
                src={user.coverUrl || ''} 
                start={user.coverStart || 0} 
                end={user.coverEnd || 10} 
                style={{ transform: `scale(${user.coverScale || 1}) translate(${user.coverX || 0}%, ${user.coverY || 0}%)` }} 
                className="w-full h-full object-cover transition-transform duration-75" 
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-65 pointer-events-none" />
          </div>
        )}

        <div className={clsx("px-6 pb-6 relative", isMinimalist && "pt-10")}>
          <div className={clsx("flex justify-between items-end mb-4", !isMinimalist && "-mt-14")}>
            
            <div className="relative flex items-center justify-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                
                {borderInfo.mode === 'svg-raw' && (
                  <div 
                    className="absolute -inset-3.5 pointer-events-none z-20 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: borderInfo.svg || '' }}
                  />
                )}

                {borderInfo.mode === 'img-src' && (
                  <img 
                    src={borderInfo.src} 
                    alt="Frame" 
                    className="absolute -inset-3.5 w-[calc(100%+28px)] h-[calc(100%+28px)] object-contain pointer-events-none z-20"
                  />
                )}

                <div 
                  className={clsx(
                    "relative w-24 h-24 rounded-full p-[3px] flex items-center justify-center transition-all duration-300",
                    borderInfo.glow && "shadow-[0_0_20px_rgba(245,158,11,0.28)]"
                  )}
                  style={{ 
                    background: borderInfo.mode === 'gradient' ? borderInfo.css : '#181818' 
                  }}
                >
                  <div className="relative w-full h-full rounded-full bg-[#1a1a1a] overflow-hidden flex items-center justify-center text-white text-3xl font-black z-10 border-[2px] border-[#121212]">
                    {user.avatar ? (
                      <MediaRenderer 
                        src={user.avatar} 
                        start={user.avatarStart || 0} 
                        end={user.avatarEnd || 10} 
                        style={{ transform: `scale(${user.avatarScale || 1}) translate(${user.avatarX || 0}%, ${user.avatarY || 0}%)` }} 
                        className="w-full h-full object-cover transition-transform duration-75" 
                      />
                    ) : user.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    {user.isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-[#121212] rounded-full p-0.5 shadow-lg">
                        <BadgeCheck size={20} className="text-blue-500 fill-blue-500/20" />
                      </div>
                    )}
                    {isOwner && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <Crown size={22} className="text-amber-400 fill-amber-400/20 drop-shadow-[0_2px_6px_rgba(245,158,11,0.6)]" />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="mb-2 flex items-center gap-2">
              {isOwnProfile ? (
                <Link href="/profile" className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg">
                  <Pencil size={14} /> Edit Profil
                </Link>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider" style={{ color: roleColor, borderColor: `${roleColor}40`, backgroundColor: `${roleColor}15` }}>
                  {isOwner ? <Crown size={14} /> : <ShieldCheck size={14} />} {user.role || 'user'}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <h1 className={clsx(
                "text-2xl font-black",
                isOwner ? "bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent" : "text-white"
              )}>
                {user.name}
              </h1>
              {user.isVerified && <BadgeCheck size={20} className="text-blue-500" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
              {user.username && <span className="text-sky-400 font-mono">@{user.username}</span>}
            </div>
            <p className="text-xs text-white/40">{user.email}</p>
            
            <div className="flex flex-wrap gap-2 mt-3 mb-4">
              {user.isVerified && <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider"><ShieldCheck size={12} /> Terverifikasi</div>}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider" style={{ color: roleColor, borderColor: `${roleColor}40`, backgroundColor: `${roleColor}15` }}>{isOwner ? <Crown size={12} /> : <ShieldCheck size={12} />} {user.role || 'user'}</div>
            </div>
            
            {user.bio ? (
              <div className="w-full bg-gradient-to-b from-[#181818] to-[#111111] rounded-2xl border border-white/10 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <BioRenderer html={user.bio} uid={user.id} />
              </div>
            ) : (
              <div className="w-full bg-[#161616] rounded-2xl border border-white/5 p-4 text-center text-xs text-white/30 italic">
                Belum ada bio.
              </div>
            )}
          </div>
        </div>

        {!isMinimalist && (
          <div className="grid grid-cols-3 border-t border-white/5 divide-x divide-white/5 bg-[#0a0a0a]">
            <div className="p-4 flex flex-col items-center justify-center"><Music2 size={16} className="text-white/60 mb-1" /><div className="text-lg font-black text-white">{songs.length}</div><div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Karya Lagu</div></div>
            <div className="p-4 flex flex-col items-center justify-center"><ShieldCheck size={16} className="text-white/60 mb-1" /><div className="text-lg font-black text-white">{user.isVerified ? 'Verified' : 'Member'}</div><div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Status</div></div>
            <div className="p-4 flex flex-col items-center justify-center"><Crown size={16} className="text-white/60 mb-1" /><div className="text-lg font-black text-white uppercase">{user.role || 'User'}</div><div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Role</div></div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-white/40 px-2">Info Akun</h3>
        <div className="bg-[#121212] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60"><Hash size={18} /></div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">ID Pengguna</div>
              <div className="text-sm font-extrabold font-mono text-white flex items-center gap-2">
                <span>{showId ? `#${user.idNumber || '---'}` : '••••••••'}</span>
                <button
                  type="button"
                  onClick={() => setShowId((v) => !v)}
                  className="text-[10px] font-bold uppercase tracking-wider text-sky-400 hover:text-sky-300 transition-colors"
                >
                  {showId ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
            </div>
          </div>
          {user.username && (
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Username</div>
              <div className="text-sm font-extrabold font-mono text-sky-400">@{user.username}</div>
            </div>
          )}
        </div>
        <div className="bg-[#121212] rounded-2xl p-4 border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60"><Calendar size={18} /></div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Bergabung Sejak</div>
            <div className="text-sm font-extrabold text-white">{joinedDate}</div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2 px-1">
          <Music2 size={18} className="text-white" /> Karya {user.name}
        </h2>
        
        {songs.length === 0 ? (
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-10 text-center text-white/40 text-xs italic">
            Pengguna ini belum mengunggah karya lagu.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {songs.map((song) => {
              const isCurrent = current?.id === song.id
              return (
                <div key={song.id} onClick={() => handlePlay(song)} className="group relative bg-[#121212] hover:bg-[#181818] p-3 rounded-2xl cursor-pointer transition-all border border-white/5 hover:border-white/15">
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#1a1a1a]">
                    {song.cover_url ? <Image src={song.cover_url} alt={song.title} fill className="object-cover" /> : <div className="w-full h-full bg-brand/10 flex items-center justify-center"><Music2 className="text-white/20" /></div>}
                    <div className={clsx("absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-all", isCurrent ? "opacity-100" : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0")}><Play size={16} fill="currentColor" className="ml-0.5" /></div>
                  </div>
                  <h3 className="text-sm font-bold truncate text-white">{song.title}</h3>
                  <p className="text-[11px] text-white/50 truncate mt-1">{song.artist}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
