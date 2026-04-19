export type FileCategory = 'video' | 'audio' | 'image'

export type FileStatus = 'pending' | 'converting' | 'done' | 'error'

export interface FileEntry {
  id: string
  file: File
  name: string
  size: number
  category: FileCategory
  extension: string
  progress: number
  status: FileStatus
  error?: string
  outputBlob?: Blob
  outputName?: string
}

export const CATEGORY_INPUT: Record<FileCategory, string[]> = {
  video: ['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v', '3gp', 'flv', 'wmv', 'mpeg', 'mpg', 'ts'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus', 'wma', 'aiff', 'amr'],
  image: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'avif', 'heic', 'tiff']
}

export const CATEGORY_OUTPUT: Record<FileCategory, string[]> = {
  video: ['mp4', 'webm', 'mov', 'mkv', 'gif', 'mp3', 'wav'],
  audio: ['mp3', 'wav', 'aac', 'ogg', 'opus', 'flac', 'm4a'],
  image: ['png', 'jpg', 'webp']
}

export function getExtension(name: string): string {
  const i = name.lastIndexOf('.')
  return i === -1 ? '' : name.slice(i + 1).toLowerCase()
}

export function getCategory(extension: string): FileCategory | null {
  const ext = extension.toLowerCase().replace('.', '')
  for (const [cat, list] of Object.entries(CATEGORY_INPUT) as [FileCategory, string[]][]) {
    if (list.includes(ext)) return cat
  }
  return null
}

export function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1)
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

export function replaceExtension(name: string, newExt: string): string {
  const i = name.lastIndexOf('.')
  const base = i === -1 ? name : name.slice(0, i)
  return `${base}.${newExt}`
}
