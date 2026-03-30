import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import { resolveFfmpegPath } from './ffmpeg-path'

ffmpeg.setFfmpegPath(resolveFfmpegPath())

export interface ImageConvertOptions {
  inputPath: string
  outputPath: string
  outputFormat: string
  onProgress?: (percent: number) => void
}

const SHARP_FORMATS = new Set([
  'jpg', 'jpeg', 'jpe', 'jfi', 'jfif', 'png', 'webp', 'gif',
  'tiff', 'avif', 'heic', 'heif', 'jp2', 'bmp', 'svg'
])

function toSharpFormat(format: string): 'jpeg' | 'png' | 'webp' | 'gif' | 'tiff' | 'avif' | 'heif' | 'jp2' {
  switch (format.toLowerCase()) {
    case 'jpg': case 'jpeg': case 'jpe': case 'jfi': case 'jfif': return 'jpeg'
    case 'webp': return 'webp'
    case 'gif': return 'gif'
    case 'tiff': return 'tiff'
    case 'avif': return 'avif'
    case 'heic': case 'heif': return 'heif'
    case 'jp2': return 'jp2'
    default: return 'png'
  }
}

function convertViaFfmpeg(inputPath: string, outputPath: string, onProgress?: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    onProgress?.(10)
    ffmpeg(inputPath)
      .on('end', () => {
        onProgress?.(100)
        resolve(outputPath)
      })
      .on('error', (err) => reject(new Error(`FFmpeg image conversion failed: ${err.message}`)))
      .save(outputPath)
  })
}

export async function convertImage(options: ImageConvertOptions): Promise<string> {
  const { inputPath, outputPath, outputFormat, onProgress } = options
  const fmt = outputFormat.toLowerCase()

  onProgress?.(10)

  const useSharp = SHARP_FORMATS.has(fmt)

  if (!useSharp) {
    return convertViaFfmpeg(inputPath, outputPath, onProgress)
  }

  const sharpFormat = toSharpFormat(fmt)
  let pipeline = sharp(inputPath)

  onProgress?.(30)

  switch (sharpFormat) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true })
      break
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 6 })
      break
    case 'webp':
      pipeline = pipeline.webp({ quality: 85 })
      break
    case 'gif':
      pipeline = pipeline.gif()
      break
    case 'tiff':
      pipeline = pipeline.tiff({ compression: 'lzw' })
      break
    case 'avif':
      pipeline = pipeline.avif({ quality: 60 })
      break
    case 'heif':
      pipeline = pipeline.heif({ quality: 80 })
      break
    case 'jp2':
      pipeline = pipeline.jp2({ quality: 80 })
      break
  }

  onProgress?.(50)
  await pipeline.toFile(outputPath)
  onProgress?.(100)

  return outputPath
}

export async function getImageThumbnail(inputPath: string): Promise<string> {
  try {
    const buffer = await sharp(inputPath).resize(320, 240, { fit: 'inside' }).png().toBuffer()
    return `data:image/png;base64,${buffer.toString('base64')}`
  } catch {
    return ''
  }
}
