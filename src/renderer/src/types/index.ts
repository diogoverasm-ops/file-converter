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
  video: ['mp4', 'webm', 'avi', 'mkv'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  image: ['png', 'jpg', 'webp', 'gif', 'bmp', 'tiff', 'avif'],
  document: ['pdf', 'txt', 'html', 'md'],
  data: ['csv', 'json', 'xml', 'yaml']
}

export const CATEGORY_EXTENSIONS: Record<FileCategory, string[]> = {
  video: ['mp4', 'avi', 'mov', 'mkv', 'webm'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'avif'],
  document: ['docx', 'pdf', 'txt', 'html', 'md'],
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
      convertStart: (request: ConversionRequest) => Promise<void>
      onConvertProgress: (callback: (data: { fileId: string; percent: number }) => void) => () => void
      onConvertDone: (callback: (result: ConversionResult) => void) => () => void
      historyGet: () => Promise<HistoryEntry[]>
      historyClear: () => Promise<void>
      dialogOpenFiles: () => Promise<string[]>
      dialogOpenDir: () => Promise<string | null>
      getPreview: (filePath: string) => Promise<PreviewData | null>
    }
  }
}
