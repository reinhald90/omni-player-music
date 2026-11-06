'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Cropper from 'react-easy-crop'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { usePlaylistStore } from '@/store/playlistStore'
import { useHistoryStore } from '@/store/historyStore'
import { 
  BadgeCheck, LogOut, Calendar, ShieldCheck, Camera, Pencil, X, Check, 
  Image as ImageIcon, AlertCircle, Key, Copy, Plus, Eye, EyeOff, Loader2,
  Crown, ExternalLink, Heart, ListMusic, Clock, Trash2, ZoomIn, Scissors, Code2,
  Wrench, LayoutTemplate
} from 'lucide-react'
import { clsx } from 'clsx'

// 🔥 ENGINE BIO DINAMIS (MENDUKUNG BANYAK SVG, ANIMASI CSS, & AUTO-EXPAND KE BAWAH) 🔥
const BioRenderer = ({ html, uid = 'self' }: { html: string, uid?: string }) => {
  const [height, setHeight] = useState(72)
  const channelId = `BIO_RESIZE_${uid}`

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

// 🔥 PARSER BORDER UNIVERSAL (SVG MENTAH, DATA URI, URL GAMBAR, & CSS GRADIENT) 🔥
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

const createCroppedImage = async (imageSrc: string, crop: any) => {
  const image = new Image(); image.src = imageSrc; await new Promise((resolve) => (image.onload = resolve))
  const canvas = document.createElement('canvas'); const scaleX = image.naturalWidth / image.width; const scaleY = image.naturalHeight / image.height
  canvas.width = Math.min(crop.width * scaleX, 1000); canvas.height = Math.min(crop.height * scaleY, 1000)
  const ctx = canvas.getContext('2d'); if (!ctx) return imageSrc
  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg')
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

const CropModal = ({ src, type, onApply, onClose }: { src: string, type: 'avatar' | 'cover', onApply: (newSrc: string, scale: number, x: number, y: number, start: number, end: number) => void, onClose: () => void }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 }); const [zoom, setZoom] = useState(1); const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null); const [processing, setProcessing] = useState(false)
  const isVideo = src.match(/\.(mp4|webm|ogg)$/i); const videoRef = useRef<HTMLVideoElement>(null)
  const [videoDuration, setVideoDuration] = useState(0); const [startTime, setStartTime] = useState(0); const MAX_DURATION = 10
  const onCropComplete = useCallback((_a: any, b: any) => setCroppedAreaPixels(b), [])
  const handleApply = async () => {
    if (isVideo) { onApply(src, zoom, crop.x, crop.y, startTime, startTime + MAX_DURATION); return }
    setProcessing(true); try { const newImageSrc = await createCroppedImage(src, croppedAreaPixels); onApply(newImageSrc, 1, 0, 0, 0, 10) } catch (e) { alert('Gagal crop') } finally { setProcessing(false) }
  }
  useEffect(() => { if (!isVideo || !videoRef.current) return; const video = videoRef.current; const handleTimeUpdate = () => { if (video.currentTime >= startTime + MAX_DURATION) video.currentTime = startTime }; video.addEventListener('timeupdate', handleTimeUpdate); return () => video.removeEventListener('timeupdate', handleTimeUpdate) }, [isVideo, startTime])
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-[#121212] text-white z-10 border-b border-white/5">
        <button onClick={onClose} className="text-sm font-bold text-white/70 hover:text-white">Batal</button>
        <h3 className="font-bold text-sm">Atur {type === 'avatar' ? 'Foto Profil' : 'Background'}</h3>
        <button onClick={handleApply} disabled={processing} className="text-sm font-bold text-white hover:text-white/80 disabled:opacity-50">{processing ? 'Proses...' : 'Selesai'}</button>
      </div>
      <div className="relative flex-1 w-full bg-black flex flex-col">
        {isVideo ? (
          <><div className="flex-1 flex items-center justify-center p-4"><video ref={videoRef} src={src} autoPlay muted playsInline onLoadedMetadata={() => videoRef.current && setVideoDuration(videoRef.current.duration)} className={clsx("max-w-full max-h-full object-cover border border-white/10", type === 'avatar' ? "rounded-full w-64 h-64" : "rounded-xl w-full max-w-md aspect-video")} /></div>
          <div className="p-4 bg-[#121212] border-t border-white/5 space-y-4"><div className="flex items-center gap-3"><Scissors size={18} className="text-white" /><div className="flex-1"><label className="text-[10px] text-white/50 flex justify-between mb-1"><span>Mulai detik ke-{startTime}s</span><span>Selesai: {startTime + MAX_DURATION}s</span></label><input type="range" min="0" max={Math.max(0, videoDuration - MAX_DURATION)} step="1" value={startTime} onChange={(e) => { const val = parseInt(e.target.value); setStartTime(val); if (videoRef.current) videoRef.current.currentTime = val; }} className="w-full accent-white" /></div></div><div className="flex items-center gap-3"><ZoomIn size={18} className="text-white/50" /><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-white" /></div></div></>
        ) : <Cropper image={src} crop={crop} zoom={zoom} aspect={type === 'avatar' ? 1 : 16 / 9} cropShape={type === 'avatar' ? 'round' : 'rect'} showGrid={true} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} classes={{ containerClassName: "bg-black/90" }} />}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, initialized, logout, updateProfileData } = useAuthStore()
  const favorites = useFavoritesStore((s) => s.items); const playlists = usePlaylistStore((s) => s.playlists); const history = useHistoryStore((s) => s.items)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(''); const [editBio, setEditBio] = useState('')
  const [editLayout, setEditLayout] = useState('default')
  const [saving, setSaving] = useState(false); const [errorMsg, setErrorMsg] = useState<string | null>(null); const [uploadingMedia, setUploadingMedia] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState(''); const [avatarScale, setAvatarScale] = useState(1); const [avatarX, setAvatarX] = useState(0); const [avatarY, setAvatarY] = useState(0); const [avatarStart, setAvatarStart] = useState(0); const [avatarEnd, setAvatarEnd] = useState(10)
  const [coverUrl, setCoverUrl] = useState(''); const [coverScale, setCoverScale] = useState(1); const [coverX, setCoverX] = useState(0); const [coverY, setCoverY] = useState(0); const [coverStart, setCoverStart] = useState(0); const [coverEnd, setCoverEnd] = useState(10)
  const [cropModal, setCropModal] = useState<{ type: 'avatar' | 'cover', src: string } | null>(null)

  const [apiKeys, setApiKeys] = useState<any[]>([]); const [showKey, setShowKey] = useState<Record<string, boolean>>({}); const [keyName, setKeyName] = useState(''); const [generatingKey, setGeneratingKey] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null); const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialized && !isAuthenticated) router.push('/')
    if (user) {
      setEditName(user.name || ''); setEditBio(user.bio || ''); setAvatarUrl(user.avatar || '')
      setEditLayout(user.layoutTheme || 'default')
      setAvatarScale(user.avatarScale || 1); setAvatarX(user.avatarX || 0); setAvatarY(user.avatarY || 0); setAvatarStart(user.avatarStart || 0); setAvatarEnd(user.avatarEnd || 10)
      setCoverUrl(user.coverUrl || ''); setCoverScale(user.coverScale || 1); setCoverX(user.coverX || 0); setCoverY(user.coverY || 0); setCoverStart(user.coverStart || 0); setCoverEnd(user.coverEnd || 10)
    }
  }, [initialized, isAuthenticated, router, user])

  const fetchApiKeys = async () => { if (!user) return; try { const res = await fetch(`/api/db/apikey?uid=${user.id}`); const json = await res.json(); if (json.success) setApiKeys(json.data) } catch (e) {} }
  useEffect(() => { if (user) fetchApiKeys() }, [user])

  if (!initialized || !user) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>

  const joinedDate = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Baru saja'

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 15 * 1024 * 1024) { setErrorMsg('Maksimal 15MB'); setTimeout(() => setErrorMsg(null), 4000); return }
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video'); video.preload = 'metadata'
      video.onloadedmetadata = async () => { window.URL.revokeObjectURL(video.src); if (video.duration > 60) { setErrorMsg('Video maks 60 detik'); setTimeout(() => setErrorMsg(null), 4000); return } else await uploadMedia(file, type) }
      video.src = URL.createObjectURL(file)
    } else await uploadMedia(file, type)
  }

  const uploadMedia = async (file: File, type: 'avatar' | 'cover') => {
    setUploadingMedia(true); setErrorMsg(null)
    try { const formData = new FormData(); formData.append('file', file); formData.append('type', type); const res = await fetch('/api/upload', { method: 'POST', body: formData }); const json = await res.json(); if (json.success) setCropModal({ type, src: json.url }); else setErrorMsg(json.error || 'Gagal upload') } 
    catch (err) { setErrorMsg('Error upload') } finally { setUploadingMedia(false); if (avatarInputRef.current) avatarInputRef.current.value = ''; if (coverInputRef.current) coverInputRef.current.value = '' }
  }

  const applyCrop = (newSrc: string, scale: number, x: number, y: number, start: number, end: number) => {
    if (!cropModal) return
    if (cropModal.type === 'avatar') { setAvatarUrl(newSrc); setAvatarScale(scale); setAvatarX(x); setAvatarY(y); setAvatarStart(start); setAvatarEnd(end) } 
    else { setCoverUrl(newSrc); setCoverScale(scale); setCoverX(x); setCoverY(y); setCoverStart(start); setCoverEnd(end) }
    setCropModal(null)
  }

  const handleSave = async () => {
    if (!editName.trim()) return setErrorMsg('Nama kosong.')
    setSaving(true); setErrorMsg(null)
    try { 
      await updateProfileData({ name: editName, bio: editBio, avatar: avatarUrl, coverUrl: coverUrl, layoutTheme: editLayout, avatarScale, avatarX, avatarY, avatarStart, avatarEnd, coverScale, coverX, coverY, coverStart, coverEnd }); setIsEditing(false) 
    } catch (e: any) { setErrorMsg(e.message) } finally { setSaving(false) }
  }

  const cancelEdit = () => {
    setIsEditing(false); setErrorMsg(null)
    setEditName(user.name || ''); setEditBio(user.bio || ''); setAvatarUrl(user.avatar || ''); setCoverUrl(user.coverUrl || '')
    setEditLayout(user.layoutTheme || 'default')
    setAvatarScale(user.avatarScale || 1); setAvatarX(user.avatarX || 0); setAvatarY(user.avatarY || 0); setAvatarStart(user.avatarStart || 0); setAvatarEnd(user.avatarEnd || 10)
    setCoverScale(user.coverScale || 1); setCoverX(user.coverX || 0); setCoverY(user.coverY || 0); setCoverStart(user.coverStart || 0); setCoverEnd(user.coverEnd || 10)
  }

  const generateApiKey = async () => {
    if (!user) return; setGeneratingKey(true)
    try { const res = await fetch('/api/db/apikey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid: user.id, name: keyName || 'My App' }) }); const json = await res.json(); if (json.success) { setKeyName(''); fetchApiKeys() } else alert(json.error) } 
    catch (e) { alert('Gagal') } finally { setGeneratingKey(false) }
  }

  const isOwner = user.role === 'owner'
  const roleColor = (user as any).roleColor || (isOwner ? '#f59e0b' : '#ffffff')
  const isMinimalist = user.layoutTheme === 'minimalist'
  const parsedBorder = parseBorderStyle(user.borderStyle, isOwner)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      {cropModal && <CropModal src={cropModal.src} type={cropModal.type} onApply={applyCrop} onClose={() => setCropModal(null)} />}

      <div className="bg-[#121212] rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
        
        {!isMinimalist && (
          <div className="relative aspect-[21/9] w-full bg-[#1a1a1a] overflow-hidden group">
            <div className="absolute inset-0 overflow-hidden"><MediaRenderer src={coverUrl} start={coverStart} end={coverEnd} style={{ transform: `scale(${coverScale}) translate(${coverX}%, ${coverY}%)` }} className="w-full h-full object-cover transition-transform duration-75" /></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60 pointer-events-none" />
            {isEditing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 gap-3">
                <button onClick={() => coverInputRef.current?.click()} className="flex flex-col items-center gap-2 text-white font-bold text-xs uppercase bg-[#1a1a1a] px-5 py-2.5 rounded-lg hover:bg-white/20 border border-white/10">{uploadingMedia ? <Loader2 size={20} className="animate-spin" /> : <><ImageIcon size={20} /> Ganti Background</>}</button>
                {coverUrl && <button onClick={() => { setCoverUrl(''); setCoverScale(1); setCoverX(0); setCoverY(0); setCoverStart(0); setCoverEnd(10); }} className="flex flex-col items-center gap-2 text-red-400 font-bold text-xs uppercase bg-[#1a1a1a] px-5 py-2.5 rounded-lg hover:bg-red-500/20 border border-white/10"><Trash2 size={20} /> Hapus</button>}
              </div>
            )}
            <input type="file" accept="image/*,video/mp4,video/webm" ref={coverInputRef} onChange={(e) => handleMediaUpload(e, 'cover')} className="hidden" />
          </div>
        )}

        <div className={clsx("px-6 pb-6 relative", isMinimalist && "pt-10")}>
          <div className={clsx("flex justify-between items-end mb-4", !isMinimalist && "-mt-14")}>
            
            {/* 🔥 AVATAR + BORDER PRESISI SIMETRIS 🔥 */}
            <div className="relative group flex items-center justify-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                
                {/* 1A. LAYER SVG / IMAGE ANIMASI LUAR */}
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

                {/* 1B. LAYER CINCIN TIPIS & FOTO PROFIL */}
                <div 
                  className={clsx(
                    "relative w-24 h-24 rounded-full p-[2.5px] flex items-center justify-center transition-all duration-300",
                    (isOwner || parsedBorder.type === 'gradient') && "shadow-[0_0_22px_rgba(245,158,11,0.3)]"
                  )}
                  style={{ background: parsedBorder.type !== 'url' ? parsedBorder.value : '#121212' }}
                >
                  <div className="relative w-full h-full rounded-full bg-[#1a1a1a] overflow-hidden flex items-center justify-center text-white text-3xl font-black z-10 border-[2.5px] border-[#121212]">
                    {avatarUrl ? (
                      <MediaRenderer src={avatarUrl} start={avatarStart} end={avatarEnd} style={{ transform: `scale(${avatarScale}) translate(${avatarX}%, ${avatarY}%)` }} className="w-full h-full object-cover transition-transform duration-75" />
                    ) : user.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* 2. BADGES (MAHKOTA & VERIFIED) */}
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
              
              {isEditing && (
                <div className="absolute inset-2 rounded-full bg-black/60 flex items-center justify-center text-white z-40 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                   <button onClick={() => avatarInputRef.current?.click()} className="p-2 hover:text-white">{uploadingMedia ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}</button>
                   {avatarUrl && <button onClick={() => { setAvatarUrl(''); setAvatarScale(1); setAvatarX(0); setAvatarY(0); setAvatarStart(0); setAvatarEnd(10); }} className="p-2 hover:text-red-400"><Trash2 size={20} /></button>}
                </div>
              )}
              <input type="file" accept="image/*,video/mp4,video/webm" ref={avatarInputRef} onChange={(e) => handleMediaUpload(e, 'avatar')} className="hidden" />
            </div>

            <div className="mb-2 flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Link href={`/user/${user.id}`} className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all"><ExternalLink size={14} /> Profil Publik</Link>
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"><Pencil size={14} /> Edit Profil</button>
                </>
              ) : (
                <>
                  <button onClick={cancelEdit} disabled={saving} className="p-2.5 rounded-full bg-[#1a1a1a] text-white/70 hover:text-white disabled:opacity-50 border border-white/5"><X size={16} /></button>
                  <button onClick={handleSave} disabled={saving || uploadingMedia} className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:scale-105 disabled:opacity-50 transition-all shadow-lg">{saving ? 'Menyimpan...' : <><Check size={14} /> Simpan</>}</button>
                </>
              )}
            </div>
          </div>

          {errorMsg && <div className="mb-3 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs"><AlertCircle size={14} className="flex-none mt-0.5" /><span>{errorMsg}</span></div>}

          <div>
            {isEditing ? (
              <div className="mb-2">
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1 block">Nama Tampilan</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={30} className="text-xl font-black text-white bg-[#1a1a1a] border border-white/10 focus:border-white/30 rounded-lg px-3 py-2 outline-none w-full max-w-sm" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mb-1">
                <h1 className={clsx(
                  "text-2xl font-black",
                  isOwner ? "bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent" : "text-white"
                )}>
                  {user.name}
                </h1>
                {user.isVerified && <BadgeCheck size={20} className="text-blue-500" />}
              </div>
            )}
            <p className="text-sm text-white/50">{user.email}</p>
            
            <div className="flex flex-wrap gap-2 mt-3 mb-4">
              {user.isVerified && <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider"><ShieldCheck size={12} /> Terverifikasi</div>}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider" style={{ color: roleColor, borderColor: `${roleColor}40`, backgroundColor: `${roleColor}15` }}>{isOwner ? <Crown size={12} /> : <ShieldCheck size={12} />} {user.role || 'user'}</div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/tools" className="flex items-center justify-center gap-2 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl hover:bg-white/5 transition-all text-xs font-bold text-white"><Wrench size={16} /> Border Studio</Link>
                  <button onClick={() => setEditLayout(editLayout === 'default' ? 'minimalist' : 'default')} className="flex items-center justify-center gap-2 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl hover:bg-white/5 transition-all text-xs font-bold text-white"><LayoutTemplate size={16} /> Tema: {editLayout === 'default' ? 'Default' : 'Minimalis'}</button>
                </div>

                {/* 🔥 EDITOR BIO BERSIH & PROFESIONAL + LIVE PREVIEW OTOMATIS 🔥 */}
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-white/70 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 size={14} className="text-white/80" /> Custom Bio (HTML / CSS / SVG / JS)
                    </label>
                    <span className="text-[10px] text-white/40 font-mono">{editBio.length} karakter</span>
                  </div>

                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tulis bio teks biasa, atau masukkan kode HTML, CSS, dan banyak animasi <svg> sekaligus..."
                    className="w-full min-h-[140px] bg-[#080808] border border-white/10 rounded-xl p-3.5 text-xs font-mono text-emerald-400 outline-none focus:border-white/30 resize-y leading-relaxed"
                  />

                  {editBio.trim() !== '' && (
                    <div className="pt-2 space-y-1.5">
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Preview Bio:</div>
                      <div className="w-full bg-gradient-to-b from-[#161616] to-[#0f0f0f] rounded-2xl border border-white/10 overflow-hidden">
                        <BioRenderer html={editBio} uid="preview" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 🔥 KOTAK BIO UTAMA (AUTO-HEIGHT MENGIKUTI BANYAKNYA ISI BIO) 🔥 */
              user.bio ? (
                <div className="w-full bg-gradient-to-b from-[#181818] to-[#111111] rounded-2xl border border-white/10 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <BioRenderer html={user.bio} uid={user.id} />
                </div>
              ) : (
                <div className="w-full bg-[#161616] rounded-2xl border border-white/5 p-4 text-center text-xs text-white/30 italic">
                  Belum ada bio.
                </div>
              )
            )}
          </div>
        </div>

        {!isMinimalist && (
          <div className="grid grid-cols-3 border-t border-white/5 divide-x divide-white/5 bg-[#0a0a0a]">
            <div className="p-4 flex flex-col items-center justify-center"><Heart size={16} className="text-white/60 mb-1" /><div className="text-lg font-black text-white">{favorites.length}</div><div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Favorit</div></div>
            <div className="p-4 flex flex-col items-center justify-center"><ListMusic size={16} className="text-white/60 mb-1" /><div className="text-lg font-black text-white">{playlists.length}</div><div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Playlist</div></div>
            <div className="p-4 flex flex-col items-center justify-center"><Clock size={16} className="text-white/60 mb-1" /><div className="text-lg font-black text-white">{history.length}</div><div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">History</div></div>
          </div>
        )}
      </div>

      {/* INFO AKUN */}
      <div className="mt-6 space-y-3">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-white/40 px-2">Info Akun</h3>
        <div className="bg-[#121212] rounded-2xl p-4 border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60"><Calendar size={18} /></div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Bergabung Sejak</div>
            <div className="text-sm font-extrabold text-white">{joinedDate}</div>
          </div>
        </div>
        <div className="bg-[#121212] rounded-2xl p-4 border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60"><ShieldCheck size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">ID Firebase</div>
            <div className="text-xs font-mono text-white/70 truncate">{user.id}</div>
          </div>
        </div>
      </div>

      {/* DEVELOPER API KEYS */}
      <div className="mt-6 bg-[#121212] rounded-3xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-4"><Key size={18} className="text-white" /><h2 className="text-sm font-black uppercase tracking-wider text-white">Developer API Keys</h2></div>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Nama Aplikasi" value={keyName} onChange={(e) => setKeyName(e.target.value)} className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
          <button onClick={generateApiKey} disabled={generatingKey} className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg active:scale-95 disabled:opacity-50 flex items-center gap-2">{generatingKey ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Buat</button>
        </div>
        <div className="space-y-2">
          {apiKeys.map((k) => (
            <div key={k.id} className="flex items-center gap-2 p-3 bg-[#1a1a1a] rounded-lg border border-white/5">
              <div className="flex-1 min-w-0"><div className="text-[10px] text-white/40 uppercase font-bold">{k.name}</div><div className="font-mono text-xs text-white truncate">{showKey[k.id] ? k.api_key : 'Opm-••••••••••••••••••••••••'}</div></div>
              <button onClick={() => setShowKey(prev => ({ ...prev, [k.id]: !prev[k.id] }))} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-lg">{showKey[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              <button onClick={() => { navigator.clipboard.writeText(k.api_key); alert('Disalin!') }} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-lg"><Copy size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => { logout(); router.push('/') }} className="w-full mt-8 py-3.5 rounded-full bg-[#1a1a1a] border border-white/5 text-red-400 text-sm font-bold hover:bg-red-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"><LogOut size={16} /> Keluar Akun</button>
    </div>
  )
}
