'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { BadgeCheck, ShieldAlert, Shield, Users, X, Check, Crown, Palette, Settings } from 'lucide-react'
import { clsx } from 'clsx'

interface DBUser {
  id: string
  firebase_uid: string
  name: string
  email: string
  role: string
  role_color: string
  permissions: string[]
  is_verified: boolean
  created_at: string
}

const ROLES = ['admin', 'moderator', 'sekretaris', 'user']
const PERMISSIONS = [
  { id: 'manage_music', label: 'Kelola Lagu & Playlist' },
  { id: 'delete_chat', label: 'Hapus Chat Global' },
  { id: 'verify_user', label: 'Verifikasi User (Centang Biru)' },
]

export default function AdminPage() {
  const router = useRouter()
  const { user, initialized } = useAuthStore()
  const [users, setUsers] = useState<DBUser[]>([])
  const [loading, setLoading] = useState(true)
  
  // State untuk Modal Edit Role
  const [editUser, setEditUser] = useState<DBUser | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedColor, setSelectedColor] = useState('#ff2d55')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  useEffect(() => {
    if (initialized && (!user || user.email !== 'reinhald90@gmail.com')) router.push('/')
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

  useEffect(() => { fetchUsers() }, [user])

  const toggleVerify = async (targetUid: string, currentStatus: boolean) => {
    await fetch('/api/db/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail: user?.email, targetUid, isVerified: !currentStatus })
    })
    fetchUsers()
  }

  const openEditModal = (u: DBUser) => {
    setEditUser(u)
    setSelectedRole(u.role)
    setSelectedColor(u.role_color || '#ff2d55')
    // Parse permissions kalau string, kalau array langsung pakai
    const perms = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || [])
    setSelectedPerms(perms)
  }

  const saveRole = async () => {
    if (!editUser) return
    await fetch('/api/db/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminEmail: user?.email,
        targetUid: editUser.firebase_uid,
        role: selectedRole,
        roleColor: selectedColor,
        permissions: selectedPerms
      })
    })
    setEditUser(null)
    fetchUsers()
  }

  if (!initialized || !user || user.email !== 'reinhald90@gmail.com') return <div className="text-center py-20 text-white/50">Akses Ditolak.</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center">
          <ShieldAlert size={20} className="text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Admin Dashboard</h1>
          <p className="text-xs text-white/50">Kelola user, role, dan akses sistem</p>
        </div>
      </div>

      {/* List User */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-white/60" />
            <span className="text-sm font-bold text-white">Pengguna ({users.length})</span>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"/></div>
        ) : (
          <div className="divide-y divide-white/5">
            {users.map((u) => (
              <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02]">
                
                {/* Info User */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white truncate">{u.name}</span>
                    {u.is_verified && <BadgeCheck size={14} className="text-blue-500" />}
                    
                    {/* Badge Role Custom */}
                    <span 
                      className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border"
                      style={{ 
                        color: u.role_color || '#ff2d55', 
                        borderColor: `${u.role_color || '#ff2d55'}40`,
                        backgroundColor: `${u.role_color || '#ff2d55'}15`
                      }}
                    >
                      {u.role === 'owner' ? '👑 Owner' : u.role}
                    </span>
                  </div>
                  <div className="text-xs text-white/40 truncate">{u.email}</div>
                </div>
                
                {/* Aksi */}
                <div className="flex items-center gap-2 flex-none">
                  <button
                    onClick={() => toggleVerify(u.firebase_uid, u.is_verified)}
                    disabled={u.role === 'owner'}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
                      u.role === 'owner' ? "opacity-50 cursor-not-allowed bg-white/5 text-white/40" :
                      u.is_verified ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20" :
                      "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
                    )}
                  >
                    <Shield size={12} />
                    {u.role === 'owner' ? 'Owner' : (u.is_verified ? 'Cabut Verif' : 'Verifikasi')}
                  </button>

                  <button
                    onClick={() => openEditModal(u)}
                    disabled={u.role === 'owner'}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    <Settings size={12} /> Edit Role
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔥 MODAL EDIT ROLE 🔥 */}
      {editUser && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s]">
            
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="font-black text-white">Edit Akses: {editUser.name}</h3>
                <p className="text-[10px] text-white/50">Atur role, warna, dan izin akses</p>
              </div>
              <button onClick={() => setEditUser(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-5">
              
              {/* Pilih Role */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-2 block">Pilih Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button 
                      key={r}
                      onClick={() => setSelectedRole(r)}
                      className={clsx(
                        "py-2 rounded-xl text-xs font-bold capitalize border transition-all",
                        selectedRole === r ? "bg-brand/20 text-brand border-brand/50" : "bg-white/5 text-white/60 border-transparent hover:bg-white/10"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warna Role */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-2 block flex items-center gap-1"><Palette size={12}/> Warna Badge</label>
                <div className="flex items-center gap-3 bg-black/30 p-2 rounded-xl border border-white/10">
                  <input 
                    type="color" 
                    value={selectedColor} 
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-sm uppercase" style={{ color: selectedColor }}>{selectedColor}</span>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-2 block">Hak Akses (Permissions)</label>
                <div className="space-y-2">
                  {PERMISSIONS.map(p => (
                    <label key={p.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5">
                      <input 
                        type="checkbox"
                        checked={selectedPerms.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPerms([...selectedPerms, p.id])
                          else setSelectedPerms(selectedPerms.filter(id => id !== p.id))
                        }}
                        className="w-4 h-4 accent-brand"
                      />
                      <span className="text-xs font-bold text-white/80">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-white/10 bg-black/20 flex gap-2">
              <button onClick={() => setEditUser(null)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase">Batal</button>
              <button onClick={saveRole} className="flex-1 py-3 rounded-xl bg-brand text-white text-xs font-bold uppercase flex items-center justify-center gap-2"><Check size={14}/> Simpan</button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
