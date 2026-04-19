import { create } from 'zustand'
import type { FileCategory, FileEntry, FileStatus } from './types'
import { getCategory, getExtension } from './types'

export type View = 'convert' | 'youtube'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface State {
  view: View
  files: FileEntry[]
  outputFormat: string
  isConverting: boolean
  toasts: Toast[]

  setView: (v: View) => void
  addFiles: (files: FileList | File[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  setOutputFormat: (fmt: string) => void
  setProgress: (id: string, progress: number) => void
  setStatus: (id: string, status: FileStatus, error?: string) => void
  setOutput: (id: string, blob: Blob, outputName: string) => void
  setConverting: (v: boolean) => void
  filesCategory: () => FileCategory | 'mixed' | null
  addToast: (msg: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

let counter = 0
const id = () => `f_${Date.now()}_${++counter}`

export const useStore = create<State>((set, get) => ({
  view: 'convert',
  files: [],
  outputFormat: '',
  isConverting: false,
  toasts: [],

  setView: (view) => set({ view }),

  addFiles: (input) => {
    const list = Array.from(input)
    const existing = new Set(get().files.map((f) => `${f.name}_${f.size}`))
    const newOnes: FileEntry[] = []
    for (const f of list) {
      const ext = getExtension(f.name)
      const cat = getCategory(ext)
      if (!cat) continue
      const key = `${f.name}_${f.size}`
      if (existing.has(key)) continue
      existing.add(key)
      newOnes.push({
        id: id(),
        file: f,
        name: f.name,
        size: f.size,
        category: cat,
        extension: ext,
        progress: 0,
        status: 'pending'
      })
    }
    if (newOnes.length === 0) return
    set((s) => ({ files: [...s.files, ...newOnes] }))
  },

  removeFile: (fileId) => set((s) => ({ files: s.files.filter((f) => f.id !== fileId) })),
  clearFiles: () => set({ files: [], outputFormat: '', isConverting: false }),
  setOutputFormat: (outputFormat) => set({ outputFormat }),

  setProgress: (fileId, progress) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === fileId ? { ...f, progress, status: 'converting' as FileStatus } : f
      )
    })),

  setStatus: (fileId, status, error) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === fileId
          ? { ...f, status, error, progress: status === 'done' ? 100 : f.progress }
          : f
      )
    })),

  setOutput: (fileId, outputBlob, outputName) =>
    set((s) => ({
      files: s.files.map((f) => (f.id === fileId ? { ...f, outputBlob, outputName } : f))
    })),

  setConverting: (isConverting) => set({ isConverting }),

  filesCategory: () => {
    const { files } = get()
    if (files.length === 0) return null
    const cats = new Set(files.map((f) => f.category))
    return cats.size === 1 ? [...cats][0] : 'mixed'
  },

  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, message, type }
      ]
    })),

  removeToast: (toastId) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== toastId) }))
}))
