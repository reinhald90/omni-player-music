'use client'

import { useState, FormEvent } from 'react'
import { Search, Loader2, Music } from 'lucide-react'

interface Props {
  onSearch: (q: string) => void
  loading: boolean
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q || loading) return
    onSearch(q)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="glass rounded-2xl p-2 flex items-center gap-2 focus-within:border-brand/40 transition-all">
        <div className="pl-3 text-white/40">
          {loading ? <Loader2 size={18} className="animate-spin text-brand" /> : <Music size={18} />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari lagu atau paste URL YouTube…"
          className="flex-1 bg-transparent outline-none text-sm py-3 placeholder:text-white/30"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-brand to-brand-light text-white text-xs font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-brand/30 transition-all active:scale-95"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Cari</span>
        </button>
      </div>
    </form>
  )
}
