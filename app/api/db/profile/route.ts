import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' 

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

  try {
    const res = await sql`
      SELECT name, avatar_url, role, is_verified, cover_url, 
             avatar_scale, avatar_x, avatar_y, avatar_start_time, avatar_end_time,
             cover_scale, cover_x, cover_y, cover_start_time, cover_end_time 
      FROM users WHERE firebase_uid = ${uid}
    `
    if (res.length === 0) {
      return NextResponse.json({ success: true, role: 'user', is_verified: false, cover_url: null })
    }
    return NextResponse.json({ 
      success: true, 
      name: res[0].name,
      avatar_url: res[0].avatar_url,
      role: res[0].role, 
      is_verified: res[0].is_verified, 
      cover_url: res[0].cover_url,
      avatar_scale: res[0].avatar_scale,
      avatar_x: res[0].avatar_x,
      avatar_y: res[0].avatar_y,
      avatar_start_time: res[0].avatar_start_time,
      avatar_end_time: res[0].avatar_end_time,
      cover_scale: res[0].cover_scale,
      cover_x: res[0].cover_x,
      cover_y: res[0].cover_y,
      cover_start_time: res[0].cover_start_time,
      cover_end_time: res[0].cover_end_time,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid, name, email, avatar_url } = await req.json()
    if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

    const existing = await sql`SELECT id FROM users WHERE firebase_uid = ${uid}`
    
    if (existing.length === 0) {
      await sql`
        INSERT INTO users (firebase_uid, name, email, avatar_url, last_login, login_count)
        VALUES (${uid}, ${name}, ${email}, ${avatar_url || null}, CURRENT_TIMESTAMP, 1)
      `
    } else {
      await sql`
        UPDATE users SET 
          name = ${name}, email = ${email}, avatar_url = ${avatar_url || null},
          last_login = CURRENT_TIMESTAMP, login_count = login_count + 1
        WHERE firebase_uid = ${uid}
      `
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      uid, name, avatar_url, cover_url, 
      avatar_scale, avatar_x, avatar_y, avatar_start_time, avatar_end_time,
      cover_scale, cover_x, cover_y, cover_start_time, cover_end_time 
    } = body

    if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

    await sql`
      UPDATE users 
      SET 
        name = COALESCE(${name}, name),
        avatar_url = COALESCE(${avatar_url}, avatar_url),
        cover_url = COALESCE(${cover_url}, cover_url),
        avatar_scale = COALESCE(${avatar_scale}, avatar_scale),
        avatar_x = COALESCE(${avatar_x}, avatar_x),
        avatar_y = COALESCE(${avatar_y}, avatar_y),
        avatar_start_time = COALESCE(${avatar_start_time}, avatar_start_time),
        avatar_end_time = COALESCE(${avatar_end_time}, avatar_end_time),
        cover_scale = COALESCE(${cover_scale}, cover_scale),
        cover_x = COALESCE(${cover_x}, cover_x),
        cover_y = COALESCE(${cover_y}, cover_y),
        cover_start_time = COALESCE(${cover_start_time}, cover_start_time),
        cover_end_time = COALESCE(${cover_end_time}, cover_end_time),
        updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid = ${uid}
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
