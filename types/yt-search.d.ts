declare module 'yt-search' {
  export interface YTSearchVideo {
    videoId: string
    title: string
    url: string
    thumbnail: string
    seconds: number
    timestamp: string
    duration: {
      seconds: number
      timestamp: string
    }
    views: number
    author: {
      name: string
      url?: string
    }
    ago?: string
    description?: string
  }

  export interface YTSearchResult {
    videos: YTSearchVideo[]
    all: YTSearchVideo[]
    playlists?: any[]
    channels?: any[]
    lists?: any[]
  }

  function yts(query: string | { query: string; pageStart?: number; pageEnd?: number }): Promise<YTSearchResult>
  function yts(options: { videoId: string }): Promise<YTSearchVideo>

  export default yts
}
