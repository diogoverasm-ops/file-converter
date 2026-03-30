import sharp from 'sharp'

export interface ImageConvertOptions {
  inputPath: string
  outputPath: string
  outputFormat: string
  onProgress?: (percent: number) => void
}

type SharpFormat = 'png' | 'jpeg' | 'webp' | 'gif' | 'tiff' | 'avif'

function toSharpFormat(format: string): SharpFormat {
  switch (format.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'jpeg'
    case 'png':
      return 'png'
    case 'webp':
      return 'webp'
    case 'gif':
      return 'gif'
    case 'tiff':
      return 'tiff'
    case 'avif':
      return 'avif'
    case 'bmp':
      return 'png'
    default:
      return 'png'
  }
}

export async function convertImage(options: ImageConvertOptions): Promise<string> {
  const { inputPath, outputPath, outputFormat, onProgress } = options

  onProgress?.(10)

  const sharpFormat = toSharpFormat(outputFormat)

  let pipeline = sharp(inputPath)

  onProgress?.(30)

  if (outputFormat === 'bmp') {
    pipeline = pipeline.png().raw()
    await pipeline.toFile(outputPath.replace(/\.bmp$/, '.png'))
    onProgress?.(100)
    return outputPath.replace(/\.bmp$/, '.png')
  }

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
  }

  onProgress?.(50)

  await pipeline.toFile(outputPath)

  onProgress?.(100)

  return outputPath
}

export async function getImageThumbnail(inputPath: string): Promise<string> {
  const buffer = await sharp(inputPath).resize(320, 240, { fit: 'inside' }).png().toBuffer()
  return `data:image/png;base64,${buffer.toString('base64')}`
}
