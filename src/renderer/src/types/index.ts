export type FileCategory = 'video' | 'audio' | 'image' | 'document' | 'data'

export interface FileEntry {
  id: string
  name: string
  path: string
  size: number
  category: FileCategory
  extension: string
  progress: number
  status: 'pending' | 'converting' | 'done' | 'error'
  error?: string
  outputPath?: string
}

export interface ConversionResult {
  fileId: string
  outputPath: string
  success: boolean
  error?: string
}

export interface HistoryEntry {
  id: string
  inputFile: string
  inputFormat: string
  outputFile: string
  outputFormat: string
  timestamp: number
  success: boolean
  error?: string
  fileSize: number
}

export interface ConversionRequest {
  files: Array<{ id: string; path: string; name: string }>
  outputFormat: string
  outputDir: string
}

export interface PreviewData {
  type: 'image' | 'video' | 'audio' | 'text' | 'data'
  content: string
  mimeType?: string
}

export type OutputFormatMap = {
  video: string[]
  audio: string[]
  image: string[]
  document: string[]
  data: string[]
}

export const OUTPUT_FORMATS: OutputFormatMap = {
  video: [
    'mp4', 'webm', 'avi', 'mkv', 'mov', 'm4v', 'wmv', 'flv', 'ts', 'ogv',
    '3gp', '3g2', 'hevc', 'mpeg', 'asf', 'mxf', 'vob', 'm2ts', 'mts',
    'f4v', 'divx', 'xvid', 'av1', 'm2v', 'wtv'
  ],
  audio: [
    'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'm4r', 'wma', 'opus', 'mp2',
    'aiff', 'aif', 'amr', 'au', 'ac3', 'dts', 'caf', 'oga', 'voc',
    'avr', 'wv', 'snd', 'spx', 'amb', 'w64', 'tta', 'gsm', 'ircam'
  ],
  image: [
    'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'avif',
    'heic', 'heif', 'jp2', 'jfif', 'jpe', 'jfi',
    'exr', 'xbm', 'xpm', 'pgm', 'ppm', 'pnm', 'pbm', 'pam',
    'pcx', 'tga', 'sgi', 'ras', 'sun', 'pict', 'pct', 'pcd',
    'pfm', 'xwd', 'mng', 'yuv', 'uyvy', 'rgbo', 'rgba',
    'g3', 'g4', 'palm', 'mtv', 'viff', 'xv', 'ipl', 'hrz',
    'jps', 'pgx', 'picon', 'wbmp', 'jbg', 'jbig', 'map',
    'six', 'sixel', 'fax', 'otb', 'rgf', 'vips', 'fts',
    'pfm', 'pal', 'pat', 'pdb',
    'svg', 'ai', 'eps', 'ps', 'plt', 'emf', 'wmf', 'sk', 'fig', 'cgm', 'sk1'
  ],
  document: ['pdf', 'txt', 'html', 'md', 'rtf'],
  data: ['csv', 'json', 'xml', 'yaml']
}

export const CATEGORY_EXTENSIONS: Record<FileCategory, string[]> = {
  video: [
    'mp4', 'avi', 'mov', 'mkv', 'webm', 'm4v', 'mpeg', 'mpg', 'wmv', 'ts',
    'ogv', 'av1', '3gp', 'divx', 'mjpeg', 'vob', 'flv', 'mts', 'mxf', '3g2',
    'asf', 'xvid', 'rmvb', 'f4v', 'm2v', 'm2ts', 'rm', 'wtv', 'hevc', 'swf'
  ],
  audio: [
    'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'm4r', 'wma', 'opus', 'mp2',
    'aiff', 'aif', 'amr', '8svx', 'au', 'ac3', 'dts', 'caf', 'oga', 'voc',
    'avr', 'wv', 'snd', 'spx', 'amb', 'w64', 'tta', 'gsm',
    'cdda', 'cvs', 'vms', 'smp', 'ima', 'hcom', 'vox', 'ra', 'wve',
    'cvu', 'txw', 'fap', 'sou', 'cvsd', 'sln', 'prc', 'pvf', 'paf',
    'dvms', 'sph', 'sd2', 'maud', 'sndr', 'sndt', 'fssd', 'gsrt', 'htk',
    'ircam', 'nist'
  ],
  image: [
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
  ],
  document: ['docx', 'doc', 'docm', 'dotx', 'dotm', 'dot', 'pdf', 'txt', 'html', 'md', 'rtf', 'odt', 'sxw', 'xps', 'djvu', 'aw', 'kwd', 'dotm', 'dbk'],
  data: ['csv', 'json', 'xml', 'yaml', 'yml']
}

export function getFileCategory(extension: string): FileCategory | null {
  const ext = extension.toLowerCase().replace('.', '')
  for (const [category, extensions] of Object.entries(CATEGORY_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return category as FileCategory
    }
  }
  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

declare global {
  interface Window {
    api: {
      platform: string
      windowMinimize: () => Promise<void>
      windowMaximize: () => Promise<void>
      windowClose: () => Promise<void>
      convertStart: (request: ConversionRequest) => Promise<void>
      onConvertProgress: (callback: (data: { fileId: string; percent: number }) => void) => () => void
      onConvertDone: (callback: (result: ConversionResult) => void) => () => void
      historyGet: () => Promise<HistoryEntry[]>
      historyClear: () => Promise<void>
      dialogOpenFiles: () => Promise<string[]>
      dialogOpenDir: () => Promise<string | null>
      getPreview: (filePath: string) => Promise<PreviewData | null>
      getFileStats: (paths: string[]) => Promise<Array<{ path: string; size: number }>>
      openFile: (path: string) => Promise<void>
      showInFolder: (path: string) => Promise<void>
    }
  }
}
