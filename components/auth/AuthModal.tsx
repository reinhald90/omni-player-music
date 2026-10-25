'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { clsx } from 'clsx'
import Image from 'next/image'

interface Props {
  open: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export default function AuthModal({ open, onClose, initialMode = 'login' }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const { loginEmail, registerEmail, loginGoogle, loading, error, clearError } = useAuthStore()

  useEffect(() => {
    if (open) clearError()
  }, [open, clearError])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await loginEmail(email, password)
      } else {
        await registerEmail(name, email, password)
      }
      onClose()
    } catch {
      // Error ditangani oleh store
    }
  }

  const handleGoogle = async () => {
    try {
      await loginGoogle()
      onClose()
    } catch {}
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="glass-strong rounded-3xl w-full max-w-sm pointer-events-auto overflow-hidden animate-[fadeIn_0.2s]">
          {/* Header */}
          <div className="relative h-24 bg-gradient-to-br from-brand/30 via-brand-light/20 to-brand-dark/30 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-2xl shadow-brand/40 z-10">
              {mode === 'login' ? <LogIn size={24} className="text-white" /> : <UserPlus size={24} className="text-white" />}
            </div>
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/70 hover:text-white z-10">
              <X size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-5 pt-4">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/30 border border-white/5">
              <button onClick={() => { setMode('login'); clearError() }} className={clsx('py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all', mode === 'login' ? 'bg-brand/20 text-brand' : 'text-white/40')}>Masuk</button>
              <button onClick={() => { setMode('register'); clearError() }} className={clsx('py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all', mode === 'register' ? 'bg-brand/20 text-brand' : 'text-white/40')}>Daftar</button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            
            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black text-xs font-bold hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Lanjutkan dengan Google
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">atau</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {mode === 'register' && (
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="text" placeholder="Nama kamu" value={name} onChange={(e) => setName(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-brand/50 text-sm" />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-brand/50 text-sm" />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-10 py-3 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-brand/50 text-sm" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle size={13} className="flex-none mt-0.5" />
                <span className="break-all">{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-brand to-brand-light text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-brand/30 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : (mode === 'login' ? 'Masuk' : 'Daftar')}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
