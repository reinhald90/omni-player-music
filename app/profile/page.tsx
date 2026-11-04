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
  Crown, ExternalLink, Heart, ListMusic, Clock, Trash2, ZoomIn, Scissors
} from 'lucide-react'
import { clsx } from 'clsx'

// Helper bikin gambar crop
const createCroppedImage = async (imageSrc: string, crop: any) => {
  const image = new Image()
  image.src = imageSrc
  await new Promise((resolve) => (image.onload = resolve))
  
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  
  canvas.width = Math.min(crop.width * scaleX, 1000)
  canvas.height = Math.min(crop.height * scaleY, 1000)
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return imageSrc

  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg')
}

// 🔥 Komponen Video Player yang mendukung Loop 10 detik
const VideoPlayer = ({ src, start = 0, end = 10, className, style }: { src: string, start: number, end: number, className?: string, style?: any }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = start
      videoRef.current.play().catch(() => {})
    }
  }, [src, start])

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= end) {
      videoRef.current.currentTime = start
    }
  }

  return (
    <video 
      ref={videoRef}
      src={src} 
      onTimeUpdate={handleTimeUpdate}
      muted 
      playsInline 
      className={className} 
      style={style} 
    />
  )
}

const MediaRenderer = ({ src, style, className, start = 0, end = 10 }: { src: string, style?: any, className?: string, start?: number, end?: number }) => {
  if (!src) return null
  const isVideo = src.match(/\.(mp4|webm|ogg)$/i)
  if (isVideo) return <VideoPlayer src={src} start={start} end={end} className={className} style={style} />
  return <img src={src} className={className} style={style} alt="media" />
}

const CropModal = ({ src, type, onApply, onClose }: { 
  src: string, type: 'avatar' | 'cover',
  onApply: (newSrc: string, scale: number, x: number, y: number, start: number, end: number) => void,
  onClose: () => void
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  
  const isVideo = src.match(/\.(mp4|webm|ogg)$/i)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // State untuk Video Trim
  const [videoDuration, setVideoDuration] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const MAX_DURATION = 10

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // Set durasi video saat metadata dimuat
  const onVideoLoaded = () => {
    if (videoRef.current) setVideoDuration(videoRef.current.duration)
  }

  const handleApply = async () => {
    if (isVideo) {
      onApply(src, zoom, crop.x, crop.y, startTime, startTime + MAX_DURATION)
      return
    }
    setProcessing(true)
    try {
      const newImageSrc = await createCroppedImage(src, croppedAreaPixels)
      onApply(newImageSrc, 1, 0, 0, 0, 10) 
    } catch (e) { alert('Gagal crop gambar') } finally { setProcessing(false) }
  }

  // Efek untuk memantau video agar loop di 10 detik pas preview
  useEffect(() => {
    if (!isVideo || !videoRef.current) return
    const video = videoRef.current
    const handleTimeUpdate = () => {
      if (video.currentTime >= startTime + MAX_DURATION) {
        video.currentTime = startTime
      }
    }
    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [isVideo, startTime])

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/50 text-white z-10">
        <button onClick={onClose} className="text-sm font-bold text-white/70 hover:text-white">Batal</button>
        <h3 className="font-bold text-sm">Atur {type === 'avatar' ? 'Foto Profil' : 'Background'}</h3>
        <button onClick={handleApply} disabled={processing} className="text-sm font-bold text-brand hover:text-brand/80 disabled:opacity-50">
          {processing ? 'Proses...' : 'Selesai'}
        </button>
      </div>

      <div className="relative flex-1 w-full bg-black/90 flex flex-col">
        {isVideo ? (
          <>
            <div className="flex-1 flex items-center justify-center p-4">
              <video 
                ref={videoRef} src={src} autoPlay muted playsInline onLoadedMetadata={onVideoLoaded}
                className={clsx(
                  "max-w-full max-h-full object-cover shadow-2xl border-2 border-white/20",
                  type === 'avatar' ? "rounded-full w-64 h-64" : "rounded-xl w-full max-w-md aspect-video"
                )} 
              />
            </div>
            
            {/* Slider Video Trim */}
            <div className="p-4 bg-[#121212] border-t border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <Scissors size={18} className="text-brand" />
                <div className="flex-1">
                  <label className="text-[10px] text-white/50 flex justify-between mb-1">
                    <span>Mulai dari detik ke-{startTime}s</span>
                    <span>Selesai: {startTime + MAX_DURATION}s</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max={Math.max(0, videoDuration - MAX_DURATION)} 
                    step="1" 
                    value={startTime} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setStartTime(val)
                      if (videoRef.current) videoRef.current.currentTime = val
                    }} 
                    className="w-full accent-brand" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ZoomIn size={18} className="text-white/50" />
                <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-brand" />
              </div>
            </div>
          </>
        ) : (
          <Cropper
            image={src} crop={crop} zoom={zoom}
            aspect={type === 'avatar' ? 1 : 16 / 9}
            cropShape={type === 'avatar' ? 'round' : 'rect'}
            showGrid={true} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom}
            classes={{ containerClassName: "bg-black/90" }}
          />
        )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, initialized, logout, updateProfileData } = useAuthStore()
  const favorites = useFavoritesStore((s) => s.items)
  const playlists = usePlaylistStore((s) => s.playlists)
  const history = useHistoryStore((s) => s.items)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarScale, setAvatarScale] = useState(1)
  const [avatarX, setAvatarX] = useState(0)
  const [avatarY, setAvatarY] = useState(0)
  const [avatarStart, setAvatarStart] = useState(0)
  const [avatarEnd, setAvatarEnd] = useState(10)

  const [coverUrl, setCoverUrl] = useState('')
  const [coverScale, setCoverScale] = useState(1)
  const [coverX, setCoverX] = useState(0)
  const [coverY, setCoverY] = useState(0)
  const [coverStart, setCoverStart] = useState(0)
  const [coverEnd, setCoverEnd] = useState(10)

  const [cropModal, setCropModal] = useState<{ type: 'avatar' | 'cover', src: string } | null>(null)

  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [keyName, setKeyName] = useState('')
  const [generatingKey, setGeneratingKey] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialized && !isAuthenticated) router.push('/')
    if (user) {
      setEditName(user.name || '')
      setAvatarUrl(user.avatar || '')
      setAvatarScale(user.avatarScale || 1)
      setAvatarX(user.avatarX || 0)
      setAvatarY(user.avatarY || 0)
      setAvatarStart(user.avatarStart || 0)
      setAvatarEnd(user.avatarEnd || 10)
      setCoverUrl(user.coverUrl || '')
      setCoverScale(user.coverScale || 1)
      setCoverX(user.coverX || 0)
      setCoverY(user.coverY || 0)
      setCoverStart(user.coverStart || 0)
      setCoverEnd(user.coverEnd || 10)
    }
  }, [initialized, isAuthenticated, router, user])

  const fetchApiKeys = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/db/apikey?uid=${user.id}`)
      const json = await res.json()
      if (json.success) setApiKeys(json.data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { if (user) fetchApiKeys() }, [user])

  if (!initialized || !user) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-brand rounded-full animate-spin" /></div>

  const joinedDate = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Baru saja'

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file 15MB
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 15MB.')
      setTimeout(() => setErrorMsg(null), 4000)
      return
    }

    // Cek durasi video (maksimal 60 detik untuk di-trim)
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = async () => {
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 60) {
          setErrorMsg('Durasi video terlalu panjang. Maksimal 60 detik.')
          setTimeout(() => setErrorMsg(null), 4000)
          return
        } else {
          await uploadMedia(file, type)
        }
      }
      video.src = URL.createObjectURL(file)
    } else {
      await uploadMedia(file, type)
    }
  }

  const uploadMedia = async (file: File, type: 'avatar' | 'cover') => {
    setUploadingMedia(true)
    setErrorMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      
      if (json.success) {
        setCropModal({ type, src: json.url })
      } else {
        setErrorMsg(json.error || 'Gagal upload media')
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat upload.')
    } finally {
      setUploadingMedia(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const applyCrop = (newSrc: string, scale: number, x: number, y: number, start: number, end: number) => {
    if (!cropModal) return
    if (cropModal.type === 'avatar') {
      setAvatarUrl(newSrc); setAvatarScale(scale); setAvatarX(x); setAvatarY(y)
      setAvatarStart(start); setAvatarEnd(end)
    } else {
      setCoverUrl(newSrc); setCoverScale(scale); setCoverX(x); setCoverY(y)
      setCoverStart(start); setCoverEnd(end)
    }
    setCropModal(null)
  }

  const handleSave = async () => {
    if (!editName.trim()) return setErrorMsg('Nama tidak boleh kosong.')
    setSaving(true); setErrorMsg(null)
    try {
      await updateProfileData({ 
        name: editName, avatar: avatarUrl, coverUrl: coverUrl,
        avatarScale, avatarX, avatarY, avatarStart, avatarEnd,
        coverScale, coverX, coverY, coverStart, coverEnd
      })
      setIsEditing(false)
    } catch (e: any) { setErrorMsg(e.message || 'Gagal save') } finally { setSaving(false) }
  }

  const cancelEdit = () => {
    setIsEditing(false); setErrorMsg(null); 
    setEditName(user.name || ''); setAvatarUrl(user.avatar || ''); setCoverUrl(user.coverUrl || '')
    setAvatarScale(user.avatarScale || 1); setAvatarX(user.avatarX || 0); setAvatarY(user.avatarY || 0)
    setAvatarStart(user.avatarStart || 0); setAvatarEnd(user.avatarEnd || 10)
    setCoverScale(user.coverScale || 1); setCoverX(user.coverX || 0); setCoverY(user.coverY || 0)
    setCoverStart(user.coverStart || 0); setCoverEnd(user.coverEnd || 10)
  }

  const generateApiKey = async () => {
    if (!user) return
    setGeneratingKey(true)
    try {
      const res = await fetch('/api/db/apikey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid: user.id, name: keyName || 'My App' }) })
      const json = await res.json()
      if (json.success) { setKeyName(''); fetchApiKeys() } else { alert(json.error) }
    } catch (e) { alert('Gagal') }
    setGeneratingKey(false)
  }

  const isOwner = user.role === 'owner'
  const roleColor = (user as any).roleColor || (isOwner ? '#f59e0b' : '#ff2d55')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      
      {cropModal && (
        <CropModal src={cropModal.src} type={cropModal.type} onApply={applyCrop} onClose={() => setCropModal(null)} />
      )}

      <div className={clsx("glass-strong rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-500", isOwner ? "border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]" : "")}>
        
        {/* === COVER === */}
        <div className="relative aspect-[21/9] w-full bg-[#0a0a0e] overflow-hidden group">
          <div className="absolute inset-0 overflow-hidden">
            <MediaRenderer 
              src={coverUrl} 
              start={coverStart} end={coverEnd}
              style={{ transform: `scale(${coverScale}) translate(${coverX}%, ${coverY}%)` }} 
              className="w-full h-full object-cover transition-transform duration-75" 
            />
          </div>
          
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0e] via-[#0a0a0e]/80 to-transparent pointer-events-none" />

          {isEditing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 gap-3">
              <button onClick={() => coverInputRef.current?.click()} className="flex flex-col items-center gap-2 text-white font-bold text-xs uppercase tracking-wider bg-black/60 px-6 py-3 rounded-xl hover:bg-black/80 backdrop-blur-md">
                {uploadingMedia ? <Loader2 size={24} className="animate-spin" /> : <><ImageIcon size={24} /> Ganti Background</>}
              </button>
              {coverUrl && (
                <button onClick={() => { setCoverUrl(''); setCoverScale(1); setCoverX(0); setCoverY(0); setCoverStart(0); setCoverEnd(10); }} className="flex flex-col items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider bg-black/60 px-6 py-3 rounded-xl hover:bg-black/80 backdrop-blur-md">
                   <Trash2 size={24} /> Hapus
                </button>
              )}
            </div>
          )}
          <input type="file" accept="image/*,video/mp4,video/webm" ref={coverInputRef} onChange={(e) => handleMediaUpload(e, 'cover')} className="hidden" />
        </div>

        {/* === AVATAR & INFO === */}
        <div className="px-6 pb-6 relative">
          
          <div className="flex justify-between items-end -mt-16 mb-4">
            
            <div className="relative group">
              <div className="relative w-28 h-28 rounded-full bg-[#0a0a0e] p-[3px] shadow-xl z-10">
                
                {isOwner && <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0%,#f59e0b_20%,#fbbf24_50%,transparent_80%)] animate-[spin_3s_linear_infinite] -z-10" />}

                <div className="w-full h-full rounded-full bg-[#1a1a1a] overflow-hidden flex items-center justify-center text-white text-4xl font-black relative z-10 border-4 border-[#0a0a0e]">
                  {avatarUrl ? (
                    <div className="absolute inset-0 overflow-hidden rounded-full">
                      <MediaRenderer 
                        src={avatarUrl} 
                        start={avatarStart} end={avatarEnd}
                        style={{ transform: `scale(${avatarScale}) translate(${avatarX}%, ${avatarY}%)` }} 
                        className="w-full h-full object-cover transition-transform duration-75" 
                      />
                    </div>
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                
                {user.isVerified && <div className="absolute bottom-1 right-1 bg-[#0a0a0e] rounded-full p-1 shadow-lg z-20"><BadgeCheck size={20} className="text-blue-500 fill-blue-500/20" /></div>}
                {isOwner && <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30"><Crown size={24} className="text-amber-400 fill-amber-400/20 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" /></div>}
              </div>
              
              {isEditing && (
                <div className="absolute inset-1 rounded-full bg-black/60 flex items-center justify-center text-white z-30 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                   <button onClick={() => avatarInputRef.current?.click()} className="p-2 hover:text-brand">
                      {uploadingMedia ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                   </button>
                   {avatarUrl && (
                     <button onClick={() => { setAvatarUrl(''); setAvatarScale(1); setAvatarX(0); setAvatarY(0); setAvatarStart(0); setAvatarEnd(10); }} className="p-2 hover:text-red-400">
                        <Trash2 size={20} />
                     </button>
                   )}
                </div>
              )}
              <input type="file" accept="image/*,video/mp4,video/webm" ref={avatarInputRef} onChange={(e) => handleMediaUpload(e, 'avatar')} className="hidden" />
            </div>

            <div className="mb-2 flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Link href={`/user/${user.id}`} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 transition-all"><ExternalLink size={12} /> Profil Publik</Link>
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-lg shadow-brand/30 hover:scale-105 transition-all"><Pencil size={13} /> Edit Profil</button>
                </>
              ) : (
                <>
                  <button onClick={cancelEdit} disabled={saving} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all"><X size={16} /></button>
                  <button onClick={handleSave} disabled={saving || uploadingMedia} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-lg shadow-brand/30 hover:scale-105 disabled:opacity-50 transition-all">{saving ? 'Menyimpan...' : <><Check size={14} /> Simpan</>}</button>
                </>
              )}
            </div>
          </div>

          {errorMsg && <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-[fadeIn_0.2s]"><AlertCircle size={14} className="flex-none mt-0.5" /><span>{errorMsg}</span></div>}

          <div>
            {isEditing ? (
              <div className="mb-2">
                <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1 block">Nama Tampilan</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={30} className="text-xl font-black text-white bg-black/30 border border-white/10 focus:border-brand/50 rounded-xl px-3 py-2 outline-none w-full max-w-sm transition-colors" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mb-1">
                <h1 className={clsx("text-2xl font-black", isOwner ? "text-amber-400" : "text-white")}>{user.name}</h1>
                {user.isVerified && <BadgeCheck size={20} className="text-blue-500" />}
              </div>
            )}
            
            <p className="text-sm text-white/50">{user.email}</p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {user.isVerified && <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider"><ShieldCheck size={12} /> Terverifikasi</div>}
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shadow-sm" style={{ color: roleColor, borderColor: `${roleColor}40`, backgroundColor: `${roleColor}15` }}>
                {isOwner ? <Crown size={12} /> : <ShieldCheck size={12} />} {user.role || 'user'}
              </div>
            </div>
          </div>
        </div>

        {/* === STATISTIK === */}
        <div className="grid grid-cols-3 border-t border-white/5 divide-x divide-white/5 bg-black/20">
          <div className="p-4 flex flex-col items-center justify-center group cursor-pointer hover:bg-white/5 transition-colors"><div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Heart size={14} className="text-pink-400" /></div><div className="text-xl font-black text-white">{favorites.length}</div><div className="text-[9px] text-white/40 uppercase tracking-wider font-bold mt-0.5">Favorit</div></div>
          <div className="p-4 flex flex-col items-center justify-center group cursor-pointer hover:bg-white/5 transition-colors"><div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><ListMusic size={14} className="text-purple-400" /></div><div className="text-xl font-black text-white">{playlists.length}</div><div className="text-[9px] text-white/40 uppercase tracking-wider font-bold mt-0.5">Playlist</div></div>
          <div className="p-4 flex flex-col items-center justify-center group cursor-pointer hover:bg-white/5 transition-colors"><div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Clock size={14} className="text-cyan-400" /></div><div className="text-xl font-black text-white">{history.length}</div><div className="text-[9px] text-white/40 uppercase tracking-wider font-bold mt-0.5">History</div></div>
        </div>
      </div>

      {/* === DETAIL AKUN === */}
      <div className="mt-6 space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-white/40 px-1">Info Akun</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-none"><Calendar size={18} className="text-white/60" /></div><div><div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Bergabung Sejak</div><div className="text-sm font-bold text-white">{joinedDate}</div></div></div>
          <div className="glass rounded-2xl p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-none"><ShieldCheck size={18} className="text-white/60" /></div><div className="min-w-0"><div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">ID Firebase</div><div className="text-xs font-mono text-white/70 truncate">{user.id}</div></div></div>
        </div>
      </div>

      {/* === API KEY MANAGEMENT === */}
      <div className="mt-8 glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4"><Key size={18} className="text-brand" /><h2 className="text-sm font-black uppercase tracking-wider text-white">Developer API Keys</h2></div>
        <p className="text-xs text-white/50 mb-4">Gunakan API Key ini untuk mengakses fitur Omni Player Music dari aplikasi luar.</p>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Nama Aplikasi" value={keyName} onChange={(e) => setKeyName(e.target.value)} className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand/50" />
          <button onClick={generateApiKey} disabled={generatingKey} className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl active:scale-95 disabled:opacity-50 flex items-center gap-2">{generatingKey ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Buat</button>
        </div>
        <div className="space-y-2">
          {apiKeys.length === 0 && <p className="text-xs text-white/30 text-center py-4">Belum ada API Key.</p>}
          {apiKeys.map((k) => (
            <div key={k.id} className="flex items-center gap-2 p-3 bg-black/30 rounded-xl border border-white/5">
              <div className="flex-1 min-w-0"><div className="text-[10px] text-white/40 uppercase font-bold">{k.name}</div><div className="font-mono text-xs text-brand truncate">{showKey[k.id] ? k.api_key : 'Opm-••••••••••••••••••••••••'}</div></div>
              <button onClick={() => setShowKey(prev => ({ ...prev, [k.id]: !prev[k.id] }))} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-lg">{showKey[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              <button onClick={() => { navigator.clipboard.writeText(k.api_key); alert('Disalin!') }} className="p-2 text-white/50 hover:text-brand bg-white/5 rounded-lg"><Copy size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => { logout(); router.push('/') }} className="w-full mt-8 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-black uppercase tracking-wider hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"><LogOut size={16} /> Keluar Akun</button>
    </div>
  )
}
