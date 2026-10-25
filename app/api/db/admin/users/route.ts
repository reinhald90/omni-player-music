import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'edge'
const OWNER_EMAIL = 'reinhald90@gmail.com'

// GET: Ambil semua user (Hanya Owner)
export async function GET(req: NextRequest) {
  const adminEmail = req.nextUrl.searchParams.get('email')
  if (adminEmail !== OWNER_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const users = await sql`
      SELECT id, firebase_uid, name, email, role, is_verified, created_at 
      FROM users 
      ORDER BY created_at DESC
    `
    return NextResponse.json({ success: true, data: users })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Ubah status verifikasi user (Hanya Owner)
export async function POST(req: NextRequest) {
  const { adminEmail, targetUid, isVerified } = await req.json()
  
  if (adminEmail !== OWNER_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    await sql`
      UPDATE users 
      SET is_verified = ${isVerified} 
      WHERE firebase_uid = ${targetUid} AND role != 'owner'
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
