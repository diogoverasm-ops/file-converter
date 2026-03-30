import React, { useState, useCallback } from 'react'
import { Upload, FolderOpen } from 'lucide-react'
import { useConverterStore } from '../store/converterStore'

export function DropZone(): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false)
  const addFiles = useConverterStore((s) => s.addFiles)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const paths: string[] = []
      const files = e.dataTransfer.files
      for (let i = 0; i < files.length; i++) {
        paths.push(files[i].path)
      }
      if (paths.length > 0) {
        addFiles(paths)
      }
    },
    [addFiles]
  )

  const handleBrowse = useCallback(async () => {
    const paths = await window.api.dialogOpenFiles()
    if (paths.length > 0) {
      addFiles(paths)
    }
  }, [addFiles])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex flex-col items-center justify-center gap-6
        h-full min-h-[400px]
        border-2 border-dashed rounded-2xl
        transition-all duration-200 cursor-pointer
        ${isDragging ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-border hover:border-border-hover'}
      `}
      onClick={handleBrowse}
    >
      <div
        className={`
          w-20 h-20 rounded-2xl flex items-center justify-center
          transition-colors duration-200
          ${isDragging ? 'bg-accent/20 text-accent' : 'bg-bg-tertiary text-gray-400'}
        `}
      >
        <Upload size={36} />
      </div>

      <div className="text-center">
        <p className="text-lg font-medium text-gray-200">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mt-1">or click to browse</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center max-w-md px-4">
        {['Video', 'Audio', 'Images', 'Documents', 'Data'].map((type) => (
          <span
            key={type}
            className="px-3 py-1 text-xs rounded-full bg-bg-tertiary text-gray-400 border border-border"
          >
            {type}
          </span>
        ))}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          handleBrowse()
        }}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors text-sm font-medium"
      >
        <FolderOpen size={16} />
        Browse Files
      </button>
    </div>
  )
}
