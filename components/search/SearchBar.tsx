'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import { Search, Loader2, Music, Clock, X, Trash2 } from 'lucide-react'
import { useSearchHistoryStore } from '@/store/searchHistoryStore'

interface Props {
  onSearch: (q: string) => void
  loading: boolean
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const history = useSearchHistoryStore((s) => s.items)
  const addHistory = useSearchHistoryStore((s) => s.add)
  const removeHistory = useSearchHistoryStore((s) => s.remove)
  const clearHistory = useSearchHistoryStore((s) => s.clear)

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Close dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q || loading) return
    addHistory(q)
    onSearch(q)
    setFocused(false)
  }

  const handlePickHistory = (q: string) => {
    setQuery(q)
    addHistory(q)
    onSearch(q)
    setFocused(false)
  }

  const showDropdown = focused && history.length > 0 && query.length === 0

  return (
    <div ref={wrapperRef} className="w-full relative">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="glass rounded-2xl p-2 flex items-center gap-2 focus-within:border-brand/40 transition-all">
          <div className="pl-3 text-white/40">
            {loading ? (
              <Loader2 size={18} className="animate-spin text-brand" />
            ) : (
              <Music size={18} />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Cari lagu atau paste URL YouTube…"
            className="flex-1 bg-transparent outline-none text-sm py-3 placeholder:text-white/30"
            disabled={loading}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10"
            >
              <X size={13} />
            </button>
          )}
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

      {/* Dropdown Recent Search */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-2xl glass-strong border border-white/10 shadow-2xl overflow-hidden animate-[fadeIn_0.15s]">
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/5">
            <span className="text-[10px] font-black tracking-wider uppercase text-white/40">
              Pencarian Terakhir
            </span>
            <button
              onClick={clearHistory}
              className="text-[10px] font-bold text-red-400 hover:bg-red-500/10 px-2 py-1 rounded"
            >
              Hapus Semua
            </button>
          </div>
          <div className="max-h-[280px] overflow-y-auto py-1">
            {history.map((q) => (
              <div
                key={q}
                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/5 transition-colors group/row cursor-pointer"
                onClick={() => handlePickHistory(q)}
              >
                <Clock size={14} className="text-white/30 flex-none" />
                <span className="text-xs font-semibold text-white/80 flex-1 truncate">
                  {q}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeHistory(q)
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/row:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
