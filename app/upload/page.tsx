'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { UploadCloud, Music, ImageIcon, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UploadPage() {
  const router = useRouter()
  const { user, initialized, isAuthenticated } = useAuthStore()

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialized && !isAuthenticated) router.push('/')
  }, [initialized, isAuthenticated, router])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !audioFile || !title) return alert('Judul dan file musik wajib diisi!')

    setUploading(true)
    setProgress(0)

    try {
      // 1. Upload File Audio ke Firebase Storage
      const audioRef = ref(storage, `community/audio/${Date.now()}_${audioFile.name}`)
      const audioUpload = uploadBytesResumable(audioRef, audioFile)
      
      const audioUrl = await new Promise<string>((resolve, reject) => {
        audioUpload.on('state_changed', 
          (snapshot) => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 50),
          reject,
          async () => resolve(await getDownloadURL(audioUpload.snapshot.ref))
        )
      })

      // 2. Upload Cover (jika ada)
      let coverUrl = null
      if (coverFile) {
        const coverRef = ref(storage, `community/covers/${Date.now()}_${coverFile.name}`)
        const coverUpload = uploadBytesResumable(coverRef, coverFile)
        coverUrl = await new Promise<string>((resolve, reject) => {
          coverUpload.on('state_changed',
            (snapshot) => setProgress(50 + (snapshot.bytesTransferred / snapshot.totalBytes) * 50),
            reject,
            async () => resolve(await getDownloadURL(coverUpload.snapshot.ref))
          )
        })
      }

      // 3. Simpan ke Database Neon
      const res = await fetch('/api/db/community-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.id,
          uploader_name: user.name,
          title,
          artist: artist || 'Unknown',
          cover_url: coverUrl,
          audio_url: audioUrl
        })
      })

      if (!res.ok) throw new Error('Gagal simpan ke database')

      alert('Lagu berhasil diunggah! 🎉')
      router.push('/') 

    } catch (err: any) {
      console.error(err)
      alert('Gagal upload: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  if (!initialized || !user) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={14} /> Kembali
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <UploadCloud size={12} className="text-brand" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">Kreator</span>
        </div>
        <h1 className="text-3xl font-black gradient-text mb-2">Upload Musik</h1>
        <p className="text-sm text-white/50">Bagikan karya musikmu ke seluruh pengguna Omni Player</p>
      </div>

      <form onSubmit={handleUpload} className="glass-strong rounded-3xl p-6 space-y-4 shadow-xl">
        
        <div>
          <label className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-2 block">Judul Lagu *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Contoh: Rindu Sendiri" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand/50" />
        </div>
        <div>
          <label className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-2 block">Nama Artis</label>
          <input type="text" value={artist} onChange={e => setArtist(e.target.value)} placeholder="Nama kamu atau band" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand/50" />
        </div>

        <div>
          <label className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-2 block">File Musik (MP3) *</label>
          <div onClick={() => audioInputRef.current?.click()} className="border-2 border-dashed border-white/10 hover:border-brand/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-black/20">
            <Music size={24} className={audioFile ? 'text-brand' : 'text-white/30'} />
            <span className="text-xs font-bold mt-2 text-white/60 truncate max-w-full px-2">{audioFile ? audioFile.name : 'Pilih File MP3'}</span>
          </div>
          <input type="file" accept="audio/*" ref={audioInputRef} onChange={e => setAudioFile(e.target.files?.[0] || null)} className="hidden" />
        </div>

        <div>
          <label className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-2 block">Cover Lagu (Gambar)</label>
          <div onClick={() => coverInputRef.current?.click()} className="border-2 border-dashed border-white/10 hover:border-brand/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-black/20">
            <ImageIcon size={24} className={coverFile ? 'text-brand' : 'text-white/30'} />
            <span className="text-xs font-bold mt-2 text-white/60 truncate max-w-full px-2">{coverFile ? coverFile.name : 'Pilih Gambar (JPG/PNG)'}</span>
          </div>
          <input type="file" accept="image/*" ref={coverInputRef} onChange={e => setCoverFile(e.target.files?.[0] || null)} className="hidden" />
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-brand">
              <span>Mengunggah...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button type="submit" disabled={uploading} className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-brand to-brand-light text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-brand/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          {uploading ? 'Sedang Mengunggah...' : 'Mulai Unggah Lagu'}
        </button>
      </form>
    </div>
  )
}
