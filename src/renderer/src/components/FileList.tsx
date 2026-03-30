import React, { useCallback, useState } from 'react'
import {
  X,
  File,
  Film,
  Music,
  Image,
  FileText,
  Database,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useConverterStore } from '../store/converterStore'
import type { FileEntry, FileCategory } from '../types'
import { formatFileSize } from '../types'

const categoryIcons: Record<FileCategory, React.ReactNode> = {
  video: <Film size={18} className="text-blue-400" />,
  audio: <Music size={18} className="text-purple-400" />,
  image: <Image size={18} className="text-green-400" />,
  document: <FileText size={18} className="text-yellow-400" />,
  data: <Database size={18} className="text-cyan-400" />
}

const categoryColors: Record<FileCategory, string> = {
  video: 'bg-blue-500/10 border-blue-500/20',
  audio: 'bg-purple-500/10 border-purple-500/20',
  image: 'bg-green-500/10 border-green-500/20',
  document: 'bg-yellow-500/10 border-yellow-500/20',
  data: 'bg-cyan-500/10 border-cyan-500/20'
}

const progressColors: Record<FileCategory, string> = {
  video: 'bg-blue-500',
  audio: 'bg-purple-500',
  image: 'bg-green-500',
  document: 'bg-yellow-500',
  data: 'bg-cyan-500'
}

function StatusIcon({ file }: { file: FileEntry }): React.ReactElement {
  switch (file.status) {
    case 'converting':
      return <Loader2 size={16} className="animate-spin text-accent" />
    case 'done':
      return <CheckCircle2 size={16} className="text-green-400" />
    case 'error':
      return <AlertCircle size={16} className="text-red-400" />
    default:
      return <File size={16} className="text-gray-500" />
  }
}

export function FileList(): React.ReactElement {
  const files = useConverterStore((s) => s.files)
  const removeFile = useConverterStore((s) => s.removeFile)
  const clearFiles = useConverterStore((s) => s.clearFiles)
  const addFiles = useConverterStore((s) => s.addFiles)
  const isConverting = useConverterStore((s) => s.isConverting)
  const setPreviewFile = useConverterStore((s) => s.setPreviewFile)
  const setPreviewData = useConverterStore((s) => s.setPreviewData)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const paths: string[] = []
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        paths.push(e.dataTransfer.files[i].path)
      }
      if (paths.length > 0) addFiles(paths)
    },
    [addFiles]
  )

  const handleAddMore = useCallback(async () => {
    const paths = await window.api.dialogOpenFiles()
    if (paths.length > 0) addFiles(paths)
  }, [addFiles])

  const handlePreview = useCallback(
    async (file: FileEntry) => {
      setPreviewFile(file)
      try {
        const data = await window.api.getPreview(file.path)
        setPreviewData(data)
      } catch {
        setPreviewData(null)
      }
    },
    [setPreviewFile, setPreviewData]
  )

  return (
    <div
      className={`flex flex-col h-full transition-colors ${isDragging ? 'bg-accent/5' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-gray-300">Files</h2>
          <span className="text-xs text-gray-500 bg-bg-tertiary px-2 py-0.5 rounded-full">
            {files.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddMore}
            disabled={isConverting}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-md transition-colors disabled:opacity-50"
            title="Add more files"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={clearFiles}
            disabled={isConverting}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-bg-tertiary rounded-md transition-colors disabled:opacity-50"
            title="Clear all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files.map((file) => (
          <div
            key={file.id}
            className={`
              group flex items-center gap-3 p-3 rounded-xl border transition-colors
              ${categoryColors[file.category]}
              hover:bg-bg-hover
            `}
          >
            <div className="flex-shrink-0">{categoryIcons[file.category]}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-200 truncate">{file.name}</p>
                <StatusIcon file={file} />
              </div>

              {file.status === 'converting' && (
                <div className="mt-1.5 h-1 bg-bg-primary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressColors[file.category]}`}
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}

              {file.status === 'error' && file.error && (
                <p className="text-xs text-red-400 mt-1 truncate">{file.error}</p>
              )}

              {file.status === 'done' && (
                <p className="text-xs text-green-400 mt-1">Converted successfully</p>
              )}

              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500 uppercase">{file.extension}</span>
                {file.size > 0 && (
                  <span className="text-xs text-gray-600">{formatFileSize(file.size)}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handlePreview(file)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-md transition-colors"
                title="Preview"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={() => removeFile(file.id)}
                disabled={isConverting}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-bg-tertiary rounded-md transition-colors disabled:opacity-50"
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
