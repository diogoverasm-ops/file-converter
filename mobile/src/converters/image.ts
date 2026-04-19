import { mimeFor } from './ffmpeg'

const SUPPORTED_OUTPUTS = new Set(['png', 'jpg', 'jpeg', 'webp'])

export async function convertImage(file: File, outputExt: string): Promise<Blob> {
  if (!SUPPORTED_OUTPUTS.has(outputExt)) {
    throw new Error(`Unsupported image output format: ${outputExt}`)
  }

  const bitmap = await loadBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0)

  const mime = mimeFor(outputExt === 'jpg' ? 'jpeg' : outputExt)
  const quality = outputExt === 'png' ? undefined : 0.92

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
      mime,
      quality
    )
  })
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      // fall through to <img> path (e.g. some HEIC/AVIF on older browsers)
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    // Revoke after the next paint so canvas can finish drawing.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}
