'use client'

import ResultCard from './ResultCard'
import type { Song } from '@/types'
import { Music2 } from 'lucide-react'

interface Props {
  results: Song[]
  loading: boolean
  error: string | null
}

export default function ResultList({ results, loading, error }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-3 flex items-center gap-3 animate-pulse">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white/5 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
              <div className="h-2 bg-white/5 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">😭</div>
        <p className="text-sm font-bold text-red-400">{error}</p>
        <p className="text-xs text-white/40 mt-2">Coba kata kunci lain ya.</p>
      </div>
    )
  }

  if (!results.length) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <Music2 size={40} className="mx-auto text-white/20 mb-4" />
        <p className="text-sm font-bold text-white/60">Belum ada hasil</p>
        <p className="text-xs text-white/30 mt-1">Cari lagu favoritmu di atas 🎵</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {results.map((song) => (
        <ResultCard key={song.id} song={song} />
      ))}
    </div>
  )
}
