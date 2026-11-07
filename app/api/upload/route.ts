import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
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

const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB (Disesuaikan dengan UI Upload)
const ALLOWED_EXTENSIONS = [
  // Audio
  'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac',
  // Image (⛔ 'svg' dihapus karena rawan XSS)
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  // Video
  'mp4', 'webm'
]

export async function POST(req: NextRequest) {
  try {
    const realUid = await getVerifiedUid(req)
    if (!realUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Silakan login.' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Maksimal file 30MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ success: false, error: `Ekstensi .${ext} tidak diizinkan (SVG dilarang demi keamanan)` }, { status: 400 })
    }

    const safeType = ['audio', 'cover', 'avatar', 'chat_media'].includes(type) ? type : 'other'

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `opm_${realUid.substring(0, 5)}_${safeType}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/${filename}`
    return NextResponse.json({ success: true, url: fileUrl })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
