'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { BadgeCheck, ArrowLeft, Play, Music2, Loader2, Calendar, ShieldCheck, Crown } from 'lucide-react'
import type { Song } from '@/types'
import { clsx } from 'clsx'

// 🔥 ENGINE BIO DINAMIS UNTUK PROFIL PUBLIK 🔥
const BioRenderer = ({ html, uid = 'pub' }: { html: string, uid?: string }) => {
  const [height, setHeight] = useState(72)
  const channelId = `BIO_PUB_RESIZE_${uid}`

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === channelId && typeof e.data.height === 'number') {
        setHeight(Math.max(56, Math.min(e.data.height, 2500)))
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [channelId])

  if (!html) return null

  const styledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #ffffff;
      background: transparent;
      overflow-x: hidden;
      overflow-y: hidden;
      -webkit-font-smoothing: antialiased;
    }
    #bio-wrapper {
      width: 100%;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 10px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    a { color: #38bdf8; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
    p { margin: 0; line-height: 1.6; }
    svg { max-width: 100%; height: auto; overflow: visible; display: block; margin: 0 auto; }
    img, video { max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="bio-wrapper">${html}</div>
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
    setTimeout(updateHeight, 100);
    setTimeout(updateHeight, 400);
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

const parseBorderStyle = (raw?: string, isOwner?: boolean) => {
  const str = (raw || '').trim()
  if (!str) {
    return {
      type: isOwner ? 'gradient' : 'none',
      value: isOwner ? 'linear-gradient(135deg, #fde047 0%, #f59e0b 50%, #fef08a 100%)' : '#262626'
    }
  }
  if (str.startsWith('<svg')) {
    return { type: 'url', value: `url("data:image/svg+xml;utf8,${encodeURIComponent(str)}")` }
  }
  if (str.includes('url(')) {
    const match = str.match(/url\((['"]?)(.*?)\1\)/)
    const cleanUrl = match ? `url("${match[2]}")` : str
    return { type: 'url', value: cleanUrl }
  }
  if (str.includes('gradient')) {
    return { type: 'gradient', value: str }
  }
  return { type: 'color', value: str }
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
  id: string; name: string; email: string; avatar: string | null; coverUrl: string | null; bio: string | null; 
  borderStyle?: string; layoutTheme?: string;
  avatarScale?: number; avatarX?: number; avatarY?: number; avatarStart?: number; avatarEnd?: number; 
  coverScale?: number; coverX?: number; coverY?: number; coverStart?: number; coverEnd?: number; 
  isVerified: boolean; role: string; roleColor: string; joinedAt: number; 
}
interface CommunitySong { id: string; user_id: string; uploader_name: string; title: string; artist: string; cover_url: string | null; audio_url: string; created_at: string; }

export default function PublicProfilePage() {
  const params = useParams(); const router = useRouter(); const uid = params.uid as string
  const [data, setData] = useState<{ user: UserProfile, songs: CommunitySong[] } | null>(null)
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  const setCurrent = usePlayerStore((s) => s.setCurrent); const current = usePlayerStore((s) => s.current); const addHistory = useHistoryStore((s) => s.add)

  useEffect(() => {
    if (!uid) return
    const fetchProfile = async () => {
      try { const res = await fetch(`/api/db/users/${uid}`); const json = await res.json(); if (json.success) setData(json.data); else setError(json.error) } 
      catch (e: any) { setError('Gagal memuat profil') } finally { setLoading(false) }
    }
    fetchProfile()
  }, [uid])

  const handlePlay = (song: CommunitySong) => {
    const playerSong: Song = { id: song.id, title: song.title, artist: song.artist || song.uploader_name, duration: '0:00', durationSec: 0, views: 0, thumbnail: song.cover_url || '/icon.png', url: song.audio_url, audioUrl: song.audio_url }
    setCurrent(playerSong); addHistory(playerSong)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white" size={32} /></div>
  if (error || !data) return <div className="text-center py-20 text-red-400">{error || 'User tidak ditemukan'}</div>

  const { user, songs } = data
  const joinedDate = new Date(user.joinedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  const isOwner = user.role === 'owner'; const roleColor = user.roleColor || (isOwner ? '#f59e0b' : '#ffffff')
  const isCoverVideo = user.coverUrl?.match(/\.(mp4|webm|ogg)$/i); const isAvatarVideo = user.avatar?.match(/\.(mp4|webm|ogg)$/i)
  const isMinimalist = user.layoutTheme === 'minimalist'
  const parsedBorder = parseBorderStyle(user.borderStyle, isOwner)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white mb-6 transition-colors"><ArrowLeft size={14} /> Kembali</button>

      <div className="bg-[#121212] rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative mb-8">
        {!isMinimalist && (
          <div className="relative aspect-[21/9] w-full bg-[#1a1a1a] overflow-hidden">
            <div className="absolute inset-0 overflow-hidden"><MediaRenderer src={user.coverUrl || ''} start={user.coverStart || 0} end={user.coverEnd || 10} style={isCoverVideo ? { transform: `scale(${user.coverScale || 1}) translate(${user.coverX || 0}%, ${user.coverY || 0}%)` } : {}} className="w-full h-full object-cover" /></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60 pointer-events-none" />
          </div>
        )}

        <div className={clsx("px-6 pb-6 relative", isMinimalist && "pt-10")}>
          <div className={clsx("flex justify-between items-end mb-4", !isMinimalist && "-mt-14")}>
            
            <div className="relative flex items-center justify-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                
                {parsedBorder.type === 'url' && (
                  <div 
                    className="absolute -inset-3.5 rounded-full pointer-events-none z-20"
                    style={{ 
                      backgroundImage: parsedBorder.value,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                )}

                <div 
                  className={clsx(
                    "relative w-24 h-24 rounded-full p-[2.5px] flex items-center justify-center transition-all duration-300",
                    (isOwner || parsedBorder.type === 'gradient') && "shadow-[0_0_22px_rgba(245,158,11,0.3)]"
                  )}
                  style={{ background: parsedBorder.type !== 'url' ? parsedBorder.value : '#121212' }}
                >
                  <div className="relative w-full h-full rounded-full bg-[#1a1a1a] overflow-hidden flex items-center justify-center text-white text-3xl font-black z-10 border-[2.5px] border-[#121212]">
                    {user.avatar ? (
                      <MediaRenderer src={user.avatar} start={user.avatarStart || 0} end={user.avatarEnd || 10} style={isAvatarVideo ? { transform: `scale(${user.avatarScale || 1}) translate(${user.avatarX || 0}%, ${user.avatarY || 0}%)` } : {}} className="w-full h-full object-cover" />
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
            <div className="mb-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider" style={{ color: roleColor, borderColor: `${roleColor}40`, backgroundColor: `${roleColor}15` }}>
              {isOwner ? <Crown size={14} /> : <ShieldCheck size={14} />} {user.role}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <h1 className={clsx(
                "text-2xl font-black",
                isOwner ? "bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent" : "text-white"
              )}>
                {user.name}
              </h1>
              {user.isVerified && <BadgeCheck size={20} className="text-blue-500" />}
            </div>
            <p className="text-sm text-white/50">{user.email}</p>
            <div className="flex flex-wrap gap-4 mt-4 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-white/60 font-semibold"><Calendar size={14} /> Gabung {joinedDate}</div>
              <div className="flex items-center gap-1.5 text-xs text-white/60 font-semibold"><Music2 size={14} /> {songs.length} Lagu di-upload</div>
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
          <div className="grid grid-cols-2 border-t border-white/5 divide-x divide-white/5 bg-[#0a0a0a]">
            <div className="p-4 flex flex-col items-center justify-center"><Music2 size={16} className="text-white/60 mb-1" /><div className="text-lg font-black text-white">{songs.length}</div><div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Lagu Komunitas</div></div>
            <div className="p-4 flex flex-col items-center justify-center"><ShieldCheck size={16} className="text-white/60 mb-1" /><div className="text-lg font-black text-white">{user.isVerified ? 'Verified' : 'Member'}</div><div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Status Akun</div></div>
          </div>
        )}
      </div>

      <h2 className="text-lg font-black mb-4 flex items-center gap-2"><Music2 size={18} className="text-white" /> Karya {user.name}</h2>
      
      {songs.length === 0 ? (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-10 text-center text-white/40 text-sm">User ini belum mengunggah lagu apapun.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {songs.map((song) => {
            const isCurrent = current?.id === song.id
            return (
              <div key={song.id} onClick={() => handlePlay(song)} className="group relative bg-[#121212] hover:bg-[#181818] p-3 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5">
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 bg-[#1a1a1a]">
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
  )
}
