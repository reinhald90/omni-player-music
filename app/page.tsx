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
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
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
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <Sparkles size={12} className="text-brand" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
            Premium Music Player
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black gradient-text mb-2">
          Omni Player Music
        </h1>
        <p className="text-sm text-white/50">
          Streaming, lirik, dan riwayat — semua di satu tempat 🎧
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {/* Results */}
      <ResultList results={results} loading={loading} error={error} />

      {/* Empty state awal */}
      {!searched && !loading && (
        <div className="text-center text-white/30 text-xs mt-16">
          <p>Mulai dengan mencari lagu di atas ✨</p>
        </div>
      )}
    </div>
  )
}
