'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { BadgeCheck, ArrowLeft, Play, Music2, Loader2, Calendar, ShieldCheck, Crown } from 'lucide-react'
import type { Song } from '@/types'
import { clsx } from 'clsx'

const BioRenderer = ({ html }: { html: string }) => {
  if (!html) return null;
  const styledHtml = `<!DOCTYPE html><html><head><style>body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; color: #fff; background: transparent; display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; overflow: hidden; } a { color: #60a5fa; text-decoration: underline; } p { margin: 0; }</style></head><body>${html}</body></html>`;
  return <iframe srcDoc={styledHtml} sandbox="allow-scripts allow-popups allow-forms" className="w-full h-24 border-0 overflow-hidden" scrolling="no" title="User Bio" />;
};

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
  
  const borderCss = user.borderStyle || ''
  const isUrl = borderCss.includes('url')
  const isGradient = borderCss.includes('gradient')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white mb-6 transition-colors"><ArrowLeft size={14} /> Kembali</button>

      <div className="bg-[#121212] rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative mb-8">
        {!isMinimalist && (
          <div className="relative aspect-[21/9] w-full bg-[#1a1a1a] overflow-hidden">
            <div className="absolute inset-0 overflow-hidden"><MediaRenderer src={user.coverUrl || ''} start={user.coverStart || 0} end={user.coverEnd || 10} style={isCoverVideo ? { transform: `scale(${user.coverScale || 1}) translate(${user.coverX || 0}%, ${user.coverY || 0}%)` } : {}} className="w-full h-full object-cover" /></div>
          </div>
        )}

        <div className={clsx("px-6 pb-6 relative", isMinimalist && "pt-10")}>
          <div className={clsx("flex justify-between items-end mb-4", !isMinimalist && "-mt-16")}>
            
            {/* 🔥 AVATAR & BORDER (FIX TOTAL) 🔥 */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                
                {/* 1. LAPISAN BORDER (Di Belakang) */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{ 
                    background: isGradient ? borderCss : undefined,
                    backgroundImage: isUrl ? borderCss : undefined,
                    backgroundColor: (!isGradient && !isUrl) ? '#1a1a1a' : 'transparent',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                />

                {/* 2. FOTO PROFIL (Di Tengah) */}
                <div className="relative w-24 h-24 rounded-full bg-[#1a1a1a] overflow-hidden flex items-center justify-center text-white text-3xl font-black z-10 border-[4px] border-[#121212]">
                  {user.avatar ? (
                    <MediaRenderer src={user.avatar} start={user.avatarStart || 0} end={user.avatarEnd || 10} style={isAvatarVideo ? { transform: `scale(${user.avatarScale || 1}) translate(${user.avatarX || 0}%, ${user.avatarY || 0}%)` } : {}} className="w-full h-full object-cover" />
                  ) : user.name.charAt(0).toUpperCase()}
                </div>

                {/* 3. BADGES (Nempel di Foto) */}
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    {user.isVerified && (
                      <div className="absolute bottom-0 right-0 bg-[#121212] rounded-full p-1 shadow-lg translate-x-1 translate-y-1">
                        <BadgeCheck size={20} className="text-blue-500 fill-blue-500/10" />
                      </div>
                    )}
                    {isOwner && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Crown size={24} className="text-amber-400 drop-shadow-md" />
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
            <div className="flex items-center gap-1.5 mb-1"><h1 className="text-2xl font-black text-white">{user.name}</h1>{user.isVerified && <BadgeCheck size={20} className="text-blue-500" />}</div>
            <p className="text-sm text-white/50">{user.email}</p>
            <div className="flex flex-wrap gap-4 mt-4 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-white/60 font-semibold"><Calendar size={14} /> Gabung {joinedDate}</div>
              <div className="flex items-center gap-1.5 text-xs text-white/60 font-semibold"><Music2 size={14} /> {songs.length} Lagu di-upload</div>
            </div>
            
            <div className="w-full bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
                {user.bio ? <BioRenderer html={user.bio} /> : <div className="p-4 text-center text-xs text-white/30 italic">Belum ada bio.</div>}
            </div>
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
