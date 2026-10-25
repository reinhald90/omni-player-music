import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

  try {
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${uid}`
    if (userRes.length === 0) return NextResponse.json({ success: true, data: [] })
    const userId = userRes[0].id

    // Ambil playlists dan lagunya
    const playlists = await sql`SELECT * FROM playlists WHERE user_id = ${userId} ORDER BY created_at DESC`
    const pIds = playlists.map(p => p.id)
    
    let songs: any[] = []
    if (pIds.length > 0) {
      // Ambil semua lagu untuk playlist user ini
      songs = await sql`
        SELECT * FROM playlist_songs 
        WHERE playlist_id = ANY(${pIds}) 
        ORDER BY position ASC
      `
    }

    // Gabungkan
    const data = playlists.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: new Date(p.created_at).getTime(),
      updatedAt: new Date(p.updated_at).getTime(),
      songs: songs.filter(s => s.playlist_id === p.id).map(s => s.song_data)
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { uid, email, name, action, payload } = await req.json()
  if (!uid) return NextResponse.json({ error: 'Missing UID' }, { status: 400 })

  try {
    // 1. Dapatkan User ID
    let userId;
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${uid}`
    if (userRes.length === 0) {
      const newUser = await sql`INSERT INTO users (firebase_uid, email, name) VALUES (${uid}, ${email}, ${name}) RETURNING id`
      userId = newUser[0].id
    } else {
      userId = userRes[0].id
    }

    // 2. Action logic
    if (action === 'create') {
      const res = await sql`
        INSERT INTO playlists (user_id, name, description) 
        VALUES (${userId}, ${payload.name}, ${payload.description || ''}) 
        RETURNING id
      `
      return NextResponse.json({ success: true, newId: res[0].id })
    }

    if (action === 'delete') {
      await sql`DELETE FROM playlists WHERE id = ${payload.id} AND user_id = ${userId}`
      return NextResponse.json({ success: true })
    }

    if (action === 'addSong') {
      // Pastikan playlist milik user ini
      const check = await sql`SELECT id FROM playlists WHERE id = ${payload.playlistId} AND user_id = ${userId}`
      if (check.length === 0) throw new Error('Unauthorized')

      // Dapatkan posisi terakhir
      const posRes = await sql`SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = ${payload.playlistId}`
      const nextPos = (posRes[0].max_pos || 0) + 1

      await sql`
        INSERT INTO playlist_songs (playlist_id, song_id, song_data, position)
        VALUES (${payload.playlistId}, ${payload.song.id}, ${JSON.stringify(payload.song)}, ${nextPos})
        ON CONFLICT (playlist_id, song_id) DO NOTHING
      `
      return NextResponse.json({ success: true })
    }

    if (action === 'removeSong') {
      await sql`DELETE FROM playlist_songs WHERE playlist_id = ${payload.playlistId} AND song_id = ${payload.songId}`
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
