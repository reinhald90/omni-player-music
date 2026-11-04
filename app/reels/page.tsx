'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePlayerStore } from '@/store/playerStore'
import { useAuthStore } from '@/store/authStore'
import { Heart, MessageCircle, User, X, Send, Play, Pause } from 'lucide-react'
import { clsx } from 'clsx'

interface CommunitySong {
  id: string
  user_id: string
  uploader_name: string
  title: string
  artist: string
  cover_url: string | null
  audio_url: string
  created_at: string
}

export default function ReelsPage() {
  const [songs, setSongs] = useState<CommunitySong[]>([])
  const [likes, setLikes] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [activeCommentSong, setActiveCommentSong] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  
  const { user } = useAuthStore()
  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const toggle = usePlayerStore((s) => s.toggle)
  const setHideMiniPlayer = usePlayerStore((s) => s.setHideMiniPlayer)

  // State buat Swipe Down
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/db/community-songs').then(r => r.json()).then(j => { if(j.success) setSongs(j.data) })
    fetch('/api/db/likes?uid=all').then(r => r.json()).then(j => { if(j.success) setLikes(j.data) })
  }, [])

  useEffect(() => {
    if (!activeCommentSong) return
    fetch(`/api/db/comments?songId=${activeCommentSong}`).then(r => r.json()).then(j => {
      if (j.success) setComments(j.data)
    })
  }, [activeCommentSong])

  // Buka Komentar (Sembunyikan Mini Player)
  const openComments = (songId: string) => {
    setActiveCommentSong(songId)
    setHideMiniPlayer(true)
  }

  // Tutup Komentar (Munculkan Mini Player)
  const closeComments = () => {
    setActiveCommentSong(null)
    setHideMiniPlayer(false)
  }

  const handleLike = async (songId: string) => {
    if (!user) return alert('Login dulu ya!')
    const res = await fetch('/api/db/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, uid: user.id })
    })
    const json = await res.json()
    if (json.success) {
      if (json.action === 'liked') setLikes(prev => [...prev, { song_id: songId, user_id: user.id }])
      else setLikes(prev => prev.filter(l => !(l.song_id === songId && l.user_id === user.id)))
    }
  }

  const submitComment = async (e: React.FormEvent, songId: string) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return
    await fetch('/api/db/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, uid: user.id, name: user.name, avatar: user.avatar, message: newComment })
    })
    setNewComment('')
    fetch(`/api/db/comments?songId=${songId}`).then(r => r.json()).then(j => {
      if (j.success) setComments(j.data)
    })
  }

  // Observer buat Auto-Play saat scroll
  const observerRef = useRef<IntersectionObserver | null>(null)
  const setVideoRef = (el: HTMLDivElement | null, song: CommunitySong) => {
    if (!el) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !activeCommentSong) {
        if (current?.id !== song.id) {
          setCurrent({
            id: song.id, title: song.title, artist: song.artist, duration: '0:00',
            durationSec: 0, views: 0, thumbnail: song.cover_url || '/icon.png',
            url: song.audio_url, audioUrl: song.audio_url
          })
        }
      }
    }, { threshold: 0.6 })
    observerRef.current.observe(el)
  }

  const hasLiked = (songId: string) => likes.some(l => l.song_id === songId && l.user_id === user?.id)
  const likeCount = (songId: string) => likes.filter(l => l.song_id === songId).length

  // Fungsi Swipe Down
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    // Kalau digeser ke bawah lebih dari 50px, tutup modal
    if (distance < -50) {
      closeComments()
    }
  }

  return (
    <>
      <div className="fixed inset-0 top-16 bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-40">
        {songs.map((song) => {
          const isCurrentSong = current?.id === song.id
          return (
            <div 
              key={song.id} 
              ref={(el) => setVideoRef(el, song)}
              className="h-[calc(100vh-64px)] w-full snap-start relative flex flex-col items-center justify-center pb-20"
            >
              <div className="relative w-[90%] max-w-md aspect-square rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,45,85,0.2)]">
                {song.cover_url ? (
                  <Image src={song.cover_url} alt={song.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand/40 to-brand-dark/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <button onClick={toggle} className="absolute inset-0 flex items-center justify-center group">
                  <div className={clsx("w-20 h-20 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white transition-all duration-300", isCurrentSong && isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100")}>
                    {isCurrentSong && isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                  </div>
                </button>
              </div>

              <div className="absolute bottom-24 left-6 right-20 z-10">
                <h2 className="text-xl font-black text-white mb-1">{song.title}</h2>
                <p className="text-sm text-white/70 mb-3">{song.artist}</p>
                <Link href={`/user/${song.user_id}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all">
                  <User size={12} className="text-white/70" />
                  <span className="text-xs font-bold text-white">{song.uploader_name}</span>
                </Link>
              </div>

              <div className="absolute bottom-24 right-4 z-10 flex flex-col items-center gap-5">
                <button onClick={() => handleLike(song.id)} className="flex flex-col items-center gap-1 group">
                  <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90", hasLiked(song.id) ? "bg-brand/20 text-brand" : "bg-white/10 text-white backdrop-blur-md hover:bg-white/20")}>
                    <Heart size={22} fill={hasLiked(song.id) ? "currentColor" : "none"} />
                  </div>
                  <span className="text-[10px] font-bold text-white">{likeCount(song.id)}</span>
                </button>

                <button onClick={() => openComments(song.id)} className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90">
                    <MessageCircle size={22} />
                  </div>
                  <span className="text-[10px] font-bold text-white">Komen</span>
                </button>

                <Link href={`/user/${song.user_id}`} className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-lg font-black border-2 border-white/20">
                    {song.uploader_name.charAt(0).toUpperCase()}
                  </div>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* 🔥 MODAL KOMENTAR (Full Screen, Di Luar Container Scroll) 🔥 */}
      {activeCommentSong && (
        <div 
          className="fixed inset-0 z-[100] bg-[#0a0a0e] flex flex-col animate-[slideUp_0.3s_ease]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Header Modal (Ada Tombol X) */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#121212] pt-safe">
            <h3 className="font-black text-white text-base">{comments.length} Komentar</h3>
            <button onClick={closeComments} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          {/* List Komentar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex-none border border-white/5">
                  {c.user_avatar ? <img src={c.user_avatar} className="w-full h-full object-cover" /> : <User size={18} className="m-auto mt-2 text-white/50" />}
                </div>
                <div className="min-w-0">
                  <Link href={`/user/${c.user_id}`} className="text-xs font-bold text-white/60 hover:text-brand">
                    {c.user_name}
                  </Link>
                  <p className="text-sm text-white mt-1 break-words">{c.message}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && <div className="text-center text-white/30 text-xs mt-10">Belum ada komentar. Jadilah yang pertama!</div>}
          </div>

          {/* Input Komentar (Nempel Bawah) */}
          <form onSubmit={(e) => submitComment(e, activeCommentSong)} className="p-3 border-t border-white/10 flex gap-2 bg-[#121212] pb-safe">
            <input 
              type="text" 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Tulis komentar..." 
              className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-3 text-sm text-white outline-none focus:border-brand/50"
            />
            <button type="submit" className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center disabled:opacity-50" disabled={!newComment.trim()}>
              <Send size={18} className="ml-1" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
