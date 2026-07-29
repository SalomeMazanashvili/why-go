'use client'

import { useRef, useState } from 'react'
import { useToast } from './ToastProvider'
import { compressImage, formatBytes } from '@/lib/imageCompress'

interface Props {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export default function ImageUploader({
  value,
  onChange,
  folder = 'covers',
  label = 'Cover image',
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85,
}: Props) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [meta, setMeta] = useState<{ before: number; after: number; w: number; h: number } | null>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image')
      return
    }
    setUploading(true)
    setMeta(null)
    try {
      const result = await compressImage(file, { maxWidth, maxHeight, quality })
      const form = new FormData()
      form.append('file', result.blob, `image.${result.ext}`)
      form.append('folder', folder)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        toast.error(data?.error || 'Upload failed')
        return
      }
      onChange(data.url)
      setMeta({ before: result.originalSize, after: result.size, w: result.width, h: result.height })
      toast.success(`Uploaded (${formatBytes(result.originalSize)} → ${formatBytes(result.size)})`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      toast.error(message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      <label className="admin-label">{label}</label>

      {value ? (
        <div className="relative w-full max-w-md aspect-[16/10] bg-[#0a0a0a] border border-white/10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="preview" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full max-w-md aspect-[16/10] bg-[#0a0a0a] border border-dashed border-white/10 flex items-center justify-center text-[10px] font-bold tracking-widest uppercase text-white/30">
          No image
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="admin-btn admin-btn-ghost"
        >
          {uploading ? 'Compressing…' : value ? 'Replace image' : 'Upload image'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setMeta(null) }}
            disabled={uploading}
            className="admin-btn admin-btn-danger"
          >
            Remove
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onSelect}
        />
      </div>

      {meta && (
        <p className="text-[10px] text-white/40">
          {meta.w}×{meta.h} · {formatBytes(meta.before)} → {formatBytes(meta.after)}
          {meta.before > 0 && (
            <> ({Math.round((1 - meta.after / meta.before) * 100)}% smaller)</>
          )}
        </p>
      )}

      <input
        className="admin-input font-mono text-[11px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste an image URL"
      />
    </div>
  )
}
