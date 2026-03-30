import path from 'path'
import { convertMedia, getMediaThumbnail } from './video'
import { convertImage, getImageThumbnail } from './image'
import { convertDocument, getDocumentPreview } from './document'
import { convertData, getDataPreview } from './data'

const VIDEO_EXTS = [
  'mp4', 'avi', 'mov', 'mkv', 'webm', 'm4v', 'mpeg', 'mpg', 'wmv', 'ts',
  'ogv', 'av1', '3gp', 'divx', 'mjpeg', 'vob', 'flv', 'mts', 'mxf', '3g2',
  'asf', 'xvid', 'rmvb', 'f4v', 'm2v', 'm2ts', 'rm', 'wtv', 'hevc', 'swf'
]
const AUDIO_EXTS = [
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'm4r', 'wma', 'opus', 'mp2',
  'aiff', 'aif', 'amr', '8svx', 'au', 'ac3', 'dts', 'caf', 'oga', 'voc',
  'avr', 'wv', 'snd', 'spx', 'amb', 'w64', 'tta', 'gsm',
  'cdda', 'cvs', 'vms', 'smp', 'ima', 'hcom', 'vox', 'ra', 'wve',
  'cvu', 'txw', 'fap', 'sou', 'cvsd', 'sln', 'prc', 'pvf', 'paf',
  'dvms', 'sph', 'sd2', 'maud', 'sndr', 'sndt', 'fssd', 'gsrt', 'htk',
  'ircam', 'nist'
]
const IMAGE_EXTS = [
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'avif',
  'heic', 'heif', 'jp2', 'jfif', 'jpe', 'jfi',
  'exr', 'xbm', 'xpm', 'pgm', 'ppm', 'pnm', 'pbm', 'pam',
  'pcx', 'tga', 'sgi', 'ras', 'sun', 'pict', 'pct', 'pcd',
  'pfm', 'xwd', 'mng', 'yuv', 'uyvy', 'rgbo', 'rgba',
  'g3', 'g4', 'palm', 'mtv', 'viff', 'xv', 'ipl', 'hrz',
  'jps', 'pgx', 'picon', 'wbmp', 'jbg', 'jbig', 'map',
  'six', 'sixel', 'fax', 'otb', 'rgf', 'vips', 'fts',
  'pal', 'pdb',
  'svg', 'ai', 'eps', 'ps', 'plt', 'emf', 'wmf', 'sk', 'fig', 'cgm', 'sk1'
]
const DOC_EXTS = ['docx', 'doc', 'docm', 'dotx', 'dotm', 'dot', 'pdf', 'txt', 'html', 'md', 'rtf', 'odt', 'sxw', 'xps', 'djvu', 'aw', 'kwd', 'dbk']
const DATA_EXTS = ['csv', 'json', 'xml', 'yaml', 'yml']

type ConverterCategory = 'video' | 'audio' | 'image' | 'document' | 'data'

function getCategory(ext: string): ConverterCategory | null {
  const e = ext.toLowerCase()
  if (VIDEO_EXTS.includes(e)) return 'video'
  if (AUDIO_EXTS.includes(e)) return 'audio'
  if (IMAGE_EXTS.includes(e)) return 'image'
  if (DOC_EXTS.includes(e)) return 'document'
  if (DATA_EXTS.includes(e)) return 'data'
  return null
}

export interface ConvertFileOptions {
  inputPath: string
  outputFormat: string
  outputDir: string
  onProgress?: (percent: number) => void
}

export async function convertFile(options: ConvertFileOptions): Promise<string> {
  const { inputPath, outputFormat, outputDir, onProgress } = options
  const ext = path.extname(inputPath).slice(1).toLowerCase()
  const baseName = path.basename(inputPath, path.extname(inputPath))
  const outputPath = path.join(outputDir, `${baseName}.${outputFormat}`)
  const category = getCategory(ext)

  if (!category) {
    throw new Error(`Unsupported input format: ${ext}`)
  }

  switch (category) {
    case 'video':
    case 'audio':
      return convertMedia({ inputPath, outputPath, outputFormat, onProgress })

    case 'image':
      return convertImage({ inputPath, outputPath, outputFormat, onProgress })

    case 'document':
      return convertDocument({ inputPath, outputPath, outputFormat, onProgress })

    case 'data':
      return convertData({ inputPath, outputPath, outputFormat, onProgress })

    default:
      throw new Error(`No converter available for: ${ext}`)
  }
}

export interface PreviewResult {
  type: 'image' | 'video' | 'audio' | 'text' | 'data'
  content: string
  mimeType?: string
}

export async function getPreview(filePath: string): Promise<PreviewResult | null> {
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const category = getCategory(ext)

  if (!category) return null

  try {
    switch (category) {
      case 'image': {
        const dataUrl = await getImageThumbnail(filePath)
        return { type: 'image', content: dataUrl }
      }
      case 'video': {
        const buffer = await getMediaThumbnail(filePath)
        const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`
        return { type: 'video', content: dataUrl }
      }
      case 'audio':
        return { type: 'audio', content: filePath }
      case 'document': {
        const text = await getDocumentPreview(filePath)
        return { type: 'text', content: text }
      }
      case 'data': {
        const json = await getDataPreview(filePath)
        return { type: 'data', content: json }
      }
      default:
        return null
    }
  } catch {
    return null
  }
}
