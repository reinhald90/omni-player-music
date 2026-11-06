import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { adminAuth } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ==========================================
// HELPER: VERIFIKASI TOKEN FIREBASE
// ==========================================
async function getVerifiedUid(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    
    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    return decodedToken.uid
  } catch (error) {
    return null // Token palsu, expired, atau tidak ada
  }
}

// ==========================================
// BATASAN KEAMANAN UPLOAD
// ==========================================
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB (sesuaikan dengan kebutuhan)
const ALLOWED_EXTENSIONS = [
  // Audio
  'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac',
  // Image
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
  // Video
  'mp4', 'webm'
]

export async function POST(req: NextRequest) {
  try {
    // 1. VERIFIKASI TOKEN (Wajib Login)
    const realUid = await getVerifiedUid(req)
    if (!realUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Silakan login terlebih dahulu.' }, { status: 401 })
    }

    // 2. Ambil Form Data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'audio', 'cover', 'avatar'

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 })
    }

    // 3. Validasi Ukuran File
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Ukuran file maksimal 20MB' }, { status: 400 })
    }

    // 4. Validasi Ekstensi File
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ success: false, error: `Ekstensi .${ext} tidak diizinkan.` }, { status: 400 })
    }

    // 5. Validasi 'type' agar tidak sembarangan (misal path traversal)
    const safeType = ['audio', 'cover', 'avatar'].includes(type) ? type : 'other'

    // 6. Proses Simpan File
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Nama file unik dengan prefix UID agar mudah dilacak (opsional)
    // Menggunakan timestamp + random string agar tidak bentrok
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
