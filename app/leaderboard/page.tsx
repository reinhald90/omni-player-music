'use client'

import { useEffect, useState } from 'react'
import { Trophy, Crown, BadgeCheck, Loader2, Music } from 'lucide-react'
import Image from 'next/image'

interface LeaderboardUser {
  name: string; avatar_url: string; is_verified: boolean; role: string; role_color: string; play_count: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/db/leaderboard').then(r => r.json()).then(j => {
      if (j.success) setUsers(j.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white" size={32} /></div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
          <Trophy size={14} className="text-amber-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">Peringkat</span>
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Top Listeners</h1>
        <p className="text-sm text-white/50">Pengguna paling rajin mendengarkan musik di Omni Player.</p>
      </div>

      <div className="space-y-3">
        {users.map((u, i) => (
          <div key={i} className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg flex-none ${i === 0 ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.5)]' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-[#1a1a1a] text-white/50'}`}>
              {i + 1}
            </div>
            
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-none bg-[#1a1a1a] border border-white/10">
              {u.avatar_url ? <Image src={u.avatar_url} alt={u.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">{u.name.charAt(0)}</div>}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white truncate">{u.name}</span>
                {u.is_verified && <BadgeCheck size={14} className="text-blue-500" />}
                {u.role === 'owner' && <Crown size={14} className="text-amber-400" />}
              </div>
              <div className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5"><Music size={10} /> {u.play_count} Lagu diputar</div>
            </div>
            
            {i === 0 && <Trophy size={20} className="text-amber-400 drop-shadow-md" />}
          </div>
        ))}
      </div>
    </div>
  )
}
