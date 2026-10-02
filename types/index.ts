export interface Song {
  id: string
  title: string
  artist: string
  duration: string
  durationSec: number
  views: number
  thumbnail: string
  url: string
  audioUrl?: string
  videoUrl?: string
}

export interface LyricLine {
  time: number
  text: string
}

export interface HistoryItem extends Song {
  playedAt: number
}

export interface SearchResponse {
  success: boolean
  data?: Song[]
  error?: string
}
