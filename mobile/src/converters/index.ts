import type { FileEntry } from '../types'
import { replaceExtension } from '../types'
import { convertImage } from './image'
import { convertWithFFmpeg } from './ffmpeg'

export interface ConvertResult {
  blob: Blob
  outputName: string
}

export async function convertFile(
  entry: FileEntry,
  outputExt: string,
  onProgress: (percent: number) => void
): Promise<ConvertResult> {
  const outputName = replaceExtension(entry.name, outputExt)

  if (entry.category === 'image' && ['png', 'jpg', 'jpeg', 'webp'].includes(outputExt)) {
    onProgress(20)
    const blob = await convertImage(entry.file, outputExt)
    onProgress(100)
    return { blob, outputName }
  }

  // video and audio (also: image -> non-canvas via ffmpeg fallback if added later)
  const blob = await convertWithFFmpeg(entry.file, {
    inputName: entry.name,
    outputExt,
    category: entry.category === 'image' ? 'video' : entry.category,
    onProgress
  })
  return { blob, outputName }
}
