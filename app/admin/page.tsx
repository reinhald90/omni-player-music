'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { BadgeCheck, ShieldAlert, Shield, Users } from 'lucide-react'
import { clsx } from 'clsx'

interface DBUser {
  id: string
  firebase_uid: string
  name: string
  email: string
  role: string
  is_verified: boolean
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const { user, initialized } = useAuthStore()
  const [users, setUsers] = useState<DBUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Proteksi halaman: Tendang user yang bukan Owner
    if (initialized && (!user || user.email !== 'reinhald90@gmail.com')) {
      router.push('/')
    }
  }, [initialized, user, router])

  const fetchUsers = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/db/admin/users?email=${user.email}`)
      const json = await res.json()
      if (json.success) setUsers(json.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [user])

  const toggleVerify = async (targetUid: string, currentStatus: boolean) => {
    try {
      await fetch('/api/db/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminEmail: user?.email, 
          targetUid, 
          isVerified: !currentStatus 
        })
      })
      // Refresh list setelah update
      fetchUsers()
    } catch (e) { console.error(e) }
  }

  if (!initialized || !user || user.email !== 'reinhald90@gmail.com') {
    return <div className="text-center py-20 text-white/50">Akses Ditolak.</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center">
          <ShieldAlert size={20} className="text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Admin Dashboard</h1>
          <p className="text-xs text-white/50">Hanya bisa diakses oleh Founder</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
          <Users size={16} className="text-white/60" />
          <span className="text-sm font-bold text-white">Daftar Pengguna ({users.length})</span>
        </div>
        
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"/></div>
        ) : (
          <div className="divide-y divide-white/5">
            {users.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02]">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate">{u.name}</span>
                    {u.is_verified && <BadgeCheck size={14} className="text-blue-500" />}
                    {u.role === 'owner' && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">Owner</span>
                    )}
                  </div>
                  <div className="text-xs text-white/40 truncate">{u.email}</div>
                </div>
                
                <button
                  onClick={() => toggleVerify(u.firebase_uid, u.is_verified)}
                  disabled={u.role === 'owner'}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
                    u.role === 'owner' 
                      ? "opacity-50 cursor-not-allowed bg-white/5 text-white/40"
                      : u.is_verified 
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                        : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
                  )}
                >
                  <Shield size={12} />
                  {u.role === 'owner' ? 'Owner' : (u.is_verified ? 'Cabut Verifikasi' : 'Verifikasi')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
