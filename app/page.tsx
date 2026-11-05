'use client'

import { useState } from 'react'
import SearchBar from '@/components/search/SearchBar'
import ResultList from '@/components/search/ResultList'
import type { Song } from '@/types'
import { Sparkles } from 'lucide-react'

export default function HomePage() {
  const [results, setResults] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (q: string) => {
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { 'x-opm-client': 'web' }
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Gagal mencari')
      setResults(json.data || [])
    } catch (e: any) {
      setError(e.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5">
          <Sparkles size={12} className="text-white/70" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
            Premium Music Player
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Omni Player Music
        </h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">
          Streaming, lirik, dan riwayat — semua di satu tempat.
        </p>
      </div>

      <div className="mb-8">
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

      <ResultList results={results} loading={loading} error={error} />

      {!searched && !loading && (
        <div className="text-center text-white/30 text-xs mt-16">
          <p>Mulai dengan mencari lagu di atas ✨</p>
        </div>
      )}
    </div>
  )
}
