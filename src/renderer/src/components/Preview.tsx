import React, { useEffect } from 'react'
import { X, Film, Music, FileText, Database, Image as ImageIcon } from 'lucide-react'
import { useConverterStore } from '../store/converterStore'

export function Preview(): React.ReactElement | null {
  const previewFile = useConverterStore((s) => s.previewFile)
  const previewData = useConverterStore((s) => s.previewData)
  const setPreviewFile = useConverterStore((s) => s.setPreviewFile)
  const setPreviewData = useConverterStore((s) => s.setPreviewData)

  useEffect(() => {
    if (!previewFile) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setPreviewFile(null)
        setPreviewData(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [previewFile, setPreviewFile, setPreviewData])

  if (!previewFile) return null

  const handleClose = (): void => {
    setPreviewFile(null)
    setPreviewData(null)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-bg-secondary border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {previewFile.category === 'video' && <Film size={18} className="text-blue-400" />}
            {previewFile.category === 'audio' && <Music size={18} className="text-purple-400" />}
            {previewFile.category === 'image' && <ImageIcon size={18} className="text-green-400" />}
            {previewFile.category === 'document' && <FileText size={18} className="text-yellow-400" />}
            {previewFile.category === 'data' && <Database size={18} className="text-cyan-400" />}
            <div>
              <p className="text-sm font-medium text-gray-200">{previewFile.name}</p>
              <p className="text-xs text-gray-500 uppercase">{previewFile.extension} file</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {!previewData ? (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <p>Loading preview...</p>
            </div>
          ) : previewData.type === 'image' || previewData.type === 'video' ? (
            <div className="flex items-center justify-center">
              <img
                src={previewData.content}
                alt={previewFile.name}
                className="max-w-full max-h-[60vh] rounded-lg object-contain"
              />
            </div>
          ) : previewData.type === 'audio' ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Music size={48} className="text-purple-400" />
              <audio controls className="w-full max-w-md">
                <source src={`file://${previewData.content}`} />
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : (
            <pre className="text-xs text-gray-300 font-mono bg-bg-primary rounded-xl p-4 overflow-auto max-h-[50vh] whitespace-pre-wrap break-words">
              {previewData.content}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border">
          <p className="text-xs text-gray-500 truncate">
            {previewFile.path}
          </p>
        </div>
      </div>
    </div>
  )
}
