import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Ambil Top 10 User berdasarkan jumlah history
    const topListeners = await sql`
      SELECT u.name, u.avatar_url, u.is_verified, u.role, u.role_color, COUNT(h.id) as play_count
      FROM users u
      JOIN history h ON u.firebase_uid = h.user_id
      GROUP BY u.id, u.name, u.avatar_url, u.is_verified, u.role, u.role_color
      ORDER BY play_count DESC
      LIMIT 10
    `
    return NextResponse.json({ success: true, data: topListeners })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
