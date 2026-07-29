import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'

const BUCKET = 'uploads'
const MAX_BYTES = 5 * 1024 * 1024 // client already compresses; 5 MB is a comfortable upper bound

const EXT_BY_MIME: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/avif': 'avif',
  'image/gif': 'gif',
}

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  try {
    const form = await req.formData()
    const file = form.get('file')
    const folder = (form.get('folder') as string | null) || 'covers'
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` }, { status: 413 })
    }
    const mime = file.type || 'application/octet-stream'
    const ext = EXT_BY_MIME[mime] || 'bin'
    if (ext === 'bin') {
      return NextResponse.json({ error: `Unsupported type ${mime}` }, { status: 415 })
    }

    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'covers'
    const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`
    const path = `${safeFolder}/${name}`

    const s = getAdminSupabase()
    const bytes = Buffer.from(await file.arrayBuffer())
    const { error } = await s.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: mime, upsert: false, cacheControl: '31536000' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = s.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl, path, size: bytes.length, mime })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
