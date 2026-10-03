'use client'

import { useMemo } from 'react'
import { useStatsStore } from '@/store/statsStore'
import { useHistoryStore } from '@/store/historyStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { usePlaylistStore } from '@/store/playlistStore'
import {
  BarChart3,
  Music2,
  Clock,
  TrendingUp,
  Heart,
  ListMusic,
  Calendar,
  Award,
  Trash2,
} from 'lucide-react'
import { clsx } from 'clsx'

export default function StatsPage() {
  const totalPlayed = useStatsStore((s) => s.totalPlayed)
  const firstPlay = useStatsStore((s) => s.firstPlay)
  const lastPlay = useStatsStore((s) => s.lastPlay)
  const artistCount = useStatsStore((s) => s.artistCount)
  const resetStats = useStatsStore((s) => s.reset)

  const history = useHistoryStore((s) => s.items)
  const favorites = useFavoritesStore((s) => s.items)
  const playlists = usePlaylistStore((s) => s.playlists)

  const topArtists = useMemo(() => {
    return Object.entries(artistCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [artistCount])

  const maxCount = topArtists[0]?.[1] || 1

  const totalPlaylistSongs = useMemo(
    () => playlists.reduce((sum, p) => sum + p.songs.length, 0),
    [playlists]
  )

  const daysActive = firstPlay
    ? Math.max(1, Math.ceil((Date.now() - firstPlay) / (1000 * 60 * 60 * 24)))
    : 0

  const formatDate = (ts: number) => {
    if (!ts) return '—'
    return new Date(ts).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <BarChart3 size={12} className="text-brand" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
            Statistik
          </span>
        </div>
        <h1 className="text-3xl font-black gradient-text mb-2">Statistik Kamu</h1>
        <p className="text-sm text-white/50">Rekap aktivitas mendengarmu</p>
      </div>

      {/* Big numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Music2}
          label="Total Lagu"
          value={totalPlayed}
          color="brand"
        />
        <StatCard
          icon={Heart}
          label="Favorit"
          value={favorites.length}
          color="pink"
        />
        <StatCard
          icon={ListMusic}
          label="Playlist"
          value={playlists.length}
          color="purple"
        />
        <StatCard
          icon={Calendar}
          label="Hari Aktif"
          value={daysActive}
          color="cyan"
        />
      </div>

      {/* Top Artists */}
      <section className="glass rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award size={16} className="text-amber-400" />
          <h2 className="text-sm font-black uppercase tracking-wider">
            Artist Teratas
          </h2>
        </div>

        {topArtists.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-6">
            Belum ada data artist. Putar lagu dulu! 🎧
          </p>
        ) : (
          <div className="space-y-3">
            {topArtists.map(([artist, count], idx) => (
              <div key={artist} className="flex items-center gap-3">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-none',
                    idx === 0
                      ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                      : idx === 1
                        ? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/30'
                        : idx === 2
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-white/5 text-white/40 border border-white/10'
                  )}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold truncate">{artist}</span>
                    <span className="text-[10px] text-white/40 font-mono flex-none ml-2">
                      {count}x
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Extra info */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <InfoCard
          icon={Clock}
          label="Pertama Kali"
          value={formatDate(firstPlay)}
        />
        <InfoCard
          icon={TrendingUp}
          label="Terakhir"
          value={formatDate(lastPlay)}
        />
        <InfoCard
          icon={ListMusic}
          label="Total Playlist Song"
          value={String(totalPlaylistSongs)}
        />
      </section>

      {/* Reset */}
      {totalPlayed > 0 && (
        <div className="text-center">
          <button
            onClick={() => {
              if (confirm('Reset semua statistik? (History & Favorit tidak akan terhapus)')) {
                resetStats()
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all active:scale-95"
          >
            <Trash2 size={12} />
            Reset Statistik
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any
  label: string
  value: number
  color: string
}) {
  const colorMap: Record<string, string> = {
    brand: 'from-brand/20 to-brand/5 text-brand',
    pink: 'from-pink-500/20 to-pink-500/5 text-pink-400',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400',
  }
  return (
    <div className="glass rounded-2xl p-4">
      <div
        className={clsx(
          'w-9 h-9 rounded-xl bg-gradient-to-br border border-white/5 flex items-center justify-center mb-3',
          colorMap[color]
        )}
      >
        <Icon size={16} />
      </div>
      <div className="text-2xl font-black tabular-nums">{value}</div>
      <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-0.5">
        {label}
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="glass rounded-2xl p-3.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-none text-white/60">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">
          {label}
        </div>
        <div className="text-xs font-bold truncate mt-0.5">{value}</div>
      </div>
    </div>
  )
}
