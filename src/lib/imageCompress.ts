// Browser-only. Compresses an image File/Blob using the Canvas API — no dependency.
// Down-scales to fit within maxWidth x maxHeight and re-encodes as WebP.

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  mimeType?: 'image/webp' | 'image/jpeg'
}

export interface CompressResult {
  blob: Blob
  width: number
  height: number
  originalSize: number
  size: number
  mimeType: string
  ext: string
}

export async function compressImage(
  file: File | Blob,
  {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    mimeType = 'image/webp',
  }: CompressOptions = {},
): Promise<CompressResult> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
      mimeType,
      quality,
    )
  })

  return {
    blob,
    width,
    height,
    originalSize: file.size,
    size: blob.size,
    mimeType,
    ext: mimeType === 'image/webp' ? 'webp' : 'jpg',
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
