import { create } from 'zustand'
import type { FileEntry, HistoryEntry, FileCategory, PreviewData } from '../types'
import { getFileCategory } from '../types'

type View = 'converter' | 'history'

interface ConverterState {
  view: View
  files: FileEntry[]
  outputFormat: string
  outputDir: string
  isConverting: boolean
  history: HistoryEntry[]
  previewFile: FileEntry | null
  previewData: PreviewData | null

  setView: (view: View) => void
  addFiles: (paths: string[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  setOutputFormat: (format: string) => void
  setOutputDir: (dir: string) => void
  setFileProgress: (fileId: string, progress: number) => void
  setFileStatus: (fileId: string, status: FileEntry['status'], error?: string, outputPath?: string) => void
  startConversion: () => void
  setHistory: (history: HistoryEntry[]) => void
  clearHistory: () => void
  setPreviewFile: (file: FileEntry | null) => void
  setPreviewData: (data: PreviewData | null) => void
  getFilesCategory: () => FileCategory | 'mixed' | null
}

let fileCounter = 0

function generateId(): string {
  fileCounter++
  return `file_${Date.now()}_${fileCounter}`
}

function getExtension(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

export const useConverterStore = create<ConverterState>((set, get) => ({
  view: 'converter',
  files: [],
  outputFormat: '',
  outputDir: '',
  isConverting: false,
  history: [],
  previewFile: null,
  previewData: null,

  setView: (view) => set({ view }),

  addFiles: (paths) => {
    const newFiles: FileEntry[] = paths
      .filter((p) => {
        const ext = getExtension(p.split(/[\\/]/).pop() || '')
        return getFileCategory(ext) !== null
      })
      .filter((p) => !get().files.some((f) => f.path === p))
      .map((p) => {
        const name = p.split(/[\\/]/).pop() || p
        const ext = getExtension(name)
        const category = getFileCategory(ext) || 'data'
        return {
          id: generateId(),
          name,
          path: p,
          size: 0,
          category,
          extension: ext,
          progress: 0,
          status: 'pending' as const
        }
      })

    if (newFiles.length > 0) {
      set((state) => ({
        files: [...state.files, ...newFiles]
      }))
    }
  },

  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id)
    })),

  clearFiles: () => set({ files: [], outputFormat: '', isConverting: false }),

  setOutputFormat: (format) => set({ outputFormat: format }),

  setOutputDir: (dir) => set({ outputDir: dir }),

  setFileProgress: (fileId, progress) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? { ...f, progress, status: 'converting' as const } : f))
    })),

  setFileStatus: (fileId, status, error, outputPath) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === fileId
          ? { ...f, status, error, outputPath, progress: status === 'done' ? 100 : f.progress }
          : f
      )
    })),

  startConversion: () => {
    const { files, outputFormat, outputDir } = get()
    if (!outputFormat || files.length === 0) return

    set({
      isConverting: true,
      files: files.map((f) => ({ ...f, status: 'converting' as const, progress: 0, error: undefined }))
    })

    const convertableFiles = files.map((f) => ({
      id: f.id,
      path: f.path,
      name: f.name
    }))

    const effectiveOutputDir = outputDir || files[0].path.split(/[\\/]/).slice(0, -1).join('\\')

    window.api.convertStart({
      files: convertableFiles,
      outputFormat,
      outputDir: effectiveOutputDir
    })
  },

  setHistory: (history) => set({ history }),
  clearHistory: () => set({ history: [] }),
  setPreviewFile: (file) => set({ previewFile: file }),
  setPreviewData: (data) => set({ previewData: data }),

  getFilesCategory: () => {
    const { files } = get()
    if (files.length === 0) return null
    const categories = new Set(files.map((f) => f.category))
    if (categories.size === 1) return [...categories][0]
    return 'mixed'
  }
}))
