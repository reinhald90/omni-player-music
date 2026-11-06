import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { adminAuth } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const OWNER_EMAIL = 'reinhald90@gmail.com'

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

// Helper untuk mengecek apakah user yang request adalah Owner sejati
async function isOwner(req: NextRequest) {
  const realUid = await getVerifiedUid(req)
  if (!realUid) return false
  const res = await sql`SELECT email, role FROM users WHERE firebase_uid = ${realUid}`
  if (res.length === 0) return false
  return res[0].email === OWNER_EMAIL || res[0].role === 'owner'
}

export async function GET(req: NextRequest) {
  // Ganti pengecekan email di URL dengan pengecekan Token!
  if (!(await isOwner(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const users = await sql`
      SELECT id, firebase_uid, name, email, role, role_color, permissions, is_verified, created_at 
      FROM users ORDER BY created_at DESC
    `
    return NextResponse.json({ success: true, data: users })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isOwner(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    // HAPUS adminEmail dari body!
    const { targetUid, role, roleColor, permissions, isVerified } = await req.json()

    if (isVerified !== undefined) {
      await sql`UPDATE users SET is_verified = ${isVerified} WHERE firebase_uid = ${targetUid} AND role != 'owner'`
    } else {
      await sql`
        UPDATE users 
        SET role = ${role}, role_color = ${roleColor}, permissions = ${JSON.stringify(permissions)}
        WHERE firebase_uid = ${targetUid} AND role != 'owner'
      `
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
