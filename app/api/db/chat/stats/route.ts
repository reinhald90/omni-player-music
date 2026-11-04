import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Hitung total user dan user yang aktif dalam 5 menit terakhir (dianggap online)
    const res = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE last_seen > NOW() - INTERVAL '5 minutes') as online_users
    `
    return NextResponse.json({ 
      success: true, 
      totalUsers: parseInt(res[0].total_users), 
      onlineUsers: parseInt(res[0].online_users) 
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
