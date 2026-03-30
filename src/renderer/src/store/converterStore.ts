import { create } from 'zustand'
import type { FileEntry, HistoryEntry, FileCategory, PreviewData } from '../types'
import { getFileCategory } from '../types'

type View = 'converter' | 'history'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ConverterState {
  view: View
  files: FileEntry[]
  outputFormat: string
  outputDir: string
  isConverting: boolean
  history: HistoryEntry[]
  previewFile: FileEntry | null
  previewData: PreviewData | null
  toasts: Toast[]

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
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
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
  toasts: [],

  setView: (view) => set({ view }),

  addFiles: async (paths) => {
    const validPaths = paths
      .filter((p) => {
        const ext = getExtension(p.split(/[\\/]/).pop() || '')
        return getFileCategory(ext) !== null
      })
      .filter((p) => !get().files.some((f) => f.path === p))

    if (validPaths.length === 0) return

    let statsMap: Record<string, number> = {}
    try {
      const stats = await window.api.getFileStats(validPaths)
      for (const s of stats) {
        statsMap[s.path] = s.size
      }
    } catch {
      // fall back to 0
    }

    const newFiles: FileEntry[] = validPaths.map((p) => {
      const name = p.split(/[\\/]/).pop() || p
      const ext = getExtension(name)
      const category = getFileCategory(ext) || 'data'
      return {
        id: generateId(),
        name,
        path: p,
        size: statsMap[p] || 0,
        category,
        extension: ext,
        progress: 0,
        status: 'pending' as const
      }
    })

    set((state) => ({
      files: [...state.files, ...newFiles]
    }))
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

    const effectiveOutputDir = outputDir || files[0].path.replace(/[\\/][^\\/]+$/, '')

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

  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, message, type }]
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    })),

  getFilesCategory: () => {
    const { files } = get()
    if (files.length === 0) return null
    const categories = new Set(files.map((f) => f.category))
    if (categories.size === 1) return [...categories][0]
    return 'mixed'
  }
}))
