import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let instance: FFmpeg | null = null
let loadPromise: Promise<FFmpeg> | null = null

const CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

export async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (instance) return instance
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const ff = new FFmpeg()
    if (onLog) ff.on('log', ({ message }) => onLog(message))
    await ff.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm')
    })
    instance = ff
    return ff
  })()

  return loadPromise
}

export interface ConvertOptions {
  inputName: string
  outputExt: string
  category: 'video' | 'audio'
  onProgress?: (percent: number) => void
}

function buildArgs(input: string, output: string, ext: string, category: 'video' | 'audio'): string[] {
  // Sensible defaults per output container.
  switch (ext) {
    case 'mp3':
      return ['-i', input, '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', output]
    case 'wav':
      return ['-i', input, '-vn', '-c:a', 'pcm_s16le', output]
    case 'aac':
    case 'm4a':
      return ['-i', input, '-vn', '-c:a', 'aac', '-b:a', '192k', output]
    case 'opus':
      return ['-i', input, '-vn', '-c:a', 'libopus', '-b:a', '128k', output]
    case 'ogg':
      return ['-i', input, '-vn', '-c:a', 'libvorbis', '-q:a', '5', output]
    case 'flac':
      return ['-i', input, '-vn', '-c:a', 'flac', output]
    case 'gif':
      return [
        '-i',
        input,
        '-vf',
        'fps=12,scale=480:-1:flags=lanczos',
        '-loop',
        '0',
        output
      ]
    case 'webm':
      return ['-i', input, '-c:v', 'libvpx-vp9', '-b:v', '1M', '-c:a', 'libopus', output]
    case 'mp4':
    case 'mov':
    case 'mkv':
      return [
        '-i',
        input,
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '160k',
        output
      ]
    default:
      return category === 'audio'
        ? ['-i', input, '-vn', output]
        : ['-i', input, output]
  }
}

export async function convertWithFFmpeg(file: File, opts: ConvertOptions): Promise<Blob> {
  const ff = await getFFmpeg()
  const inputName = `in_${Date.now()}_${opts.inputName}`
  const outputName = `out_${Date.now()}.${opts.outputExt}`

  const progressHandler = ({ progress }: { progress: number }) => {
    opts.onProgress?.(Math.max(0, Math.min(100, Math.round(progress * 100))))
  }
  ff.on('progress', progressHandler)

  try {
    await ff.writeFile(inputName, await fetchFile(file))
    const args = buildArgs(inputName, outputName, opts.outputExt, opts.category)
    await ff.exec(args)
    const data = await ff.readFile(outputName)
    const bytes =
      data instanceof Uint8Array ? data : new TextEncoder().encode(String(data))
    // Copy into a fresh ArrayBuffer so the Blob ctor accepts it under
    // strict TS lib typings (rejects Uint8Array backed by SharedArrayBuffer).
    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    return new Blob([copy.buffer], { type: mimeFor(opts.outputExt) })
  } finally {
    ff.off('progress', progressHandler)
    try {
      await ff.deleteFile(inputName)
      await ff.deleteFile(outputName)
    } catch {
      // ignore cleanup errors
    }
  }
}

export function mimeFor(ext: string): string {
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    gif: 'image/gif',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    opus: 'audio/opus',
    flac: 'audio/flac',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp'
  }
  return map[ext] || 'application/octet-stream'
}
