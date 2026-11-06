import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { adminAuth } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getVerifiedUid(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    if (!adminAuth) return null
    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    return decodedToken.uid
  } catch (error) {
    return null
  }
}

export async function GET(req: NextRequest) {
  const realUid = await getVerifiedUid(req)
  if (!realUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${realUid}`
    if (userRes.length === 0) return NextResponse.json({ success: true, data: [] })
    const userId = userRes[0].id

    const playlists = await sql`SELECT * FROM playlists WHERE user_id = ${userId} ORDER BY created_at DESC`
    const pIds = playlists.map(p => p.id)
    
    let songs: any[] = []
    if (pIds.length > 0) {
      songs = await sql`SELECT * FROM playlist_songs WHERE playlist_id = ANY(${pIds}) ORDER BY position ASC`
    }

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
  const realUid = await getVerifiedUid(req)
  if (!realUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // HAPUS uid, email, name dari body!
  const { action, payload } = await req.json()

  try {
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${realUid}`
    if (userRes.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const userId = userRes[0].id

    if (action === 'create') {
      const res = await sql`INSERT INTO playlists (user_id, name, description) VALUES (${userId}, ${payload.name}, ${payload.description || ''}) RETURNING id`
      return NextResponse.json({ success: true, newId: res[0].id })
    }

    if (action === 'delete') {
      await sql`DELETE FROM playlists WHERE id = ${payload.id} AND user_id = ${userId}`
      return NextResponse.json({ success: true })
    }

    if (action === 'addSong') {
      const check = await sql`SELECT id FROM playlists WHERE id = ${payload.playlistId} AND user_id = ${userId}`
      if (check.length === 0) throw new Error('Unauthorized')

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
