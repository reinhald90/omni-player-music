import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3'
    const filename = `opm_${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
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
