import React, { useEffect } from 'react'
import { ArrowLeftRight, Clock, Zap } from 'lucide-react'
import { useConverterStore } from './store/converterStore'
import { DropZone } from './components/DropZone'
import { FileList } from './components/FileList'
import { ConversionPanel } from './components/ConversionPanel'
import { Preview } from './components/Preview'
import { History } from './components/History'

export default function App(): React.ReactElement {
  const view = useConverterStore((s) => s.view)
  const setView = useConverterStore((s) => s.setView)
  const files = useConverterStore((s) => s.files)
  const setFileProgress = useConverterStore((s) => s.setFileProgress)
  const setFileStatus = useConverterStore((s) => s.setFileStatus)
  const isConverting = useConverterStore((s) => s.isConverting)

  useEffect(() => {
    const unsubProgress = window.api.onConvertProgress(({ fileId, percent }) => {
      setFileProgress(fileId, percent)
    })

    const unsubDone = window.api.onConvertDone(({ fileId, outputPath, success, error }) => {
      setFileStatus(fileId, success ? 'done' : 'error', error, outputPath)

      const state = useConverterStore.getState()
      const allFinished = state.files.every(
        (f) => f.id === fileId ? true : f.status === 'done' || f.status === 'error'
      )
      if (allFinished) {
        useConverterStore.setState({ isConverting: false })
      }
    })

    return () => {
      unsubProgress()
      unsubDone()
    }
  }, [setFileProgress, setFileStatus])

  return (
    <div className="flex h-screen bg-bg-primary text-white">
      {/* Sidebar */}
      <div className="w-16 flex flex-col items-center py-4 gap-2 border-r border-border bg-bg-secondary">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center mb-4">
          <Zap size={18} className="text-white" />
        </div>

        <button
          onClick={() => setView('converter')}
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${view === 'converter' ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300 hover:bg-bg-tertiary'}
          `}
          title="Converter"
        >
          <ArrowLeftRight size={18} />
        </button>

        <button
          onClick={() => setView('history')}
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${view === 'history' ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300 hover:bg-bg-tertiary'}
          `}
          title="History"
        >
          <Clock size={18} />
        </button>
      </div>

      {/* Main Content */}
      {view === 'converter' ? (
        <>
          <div className="flex-1 flex flex-col min-w-0">
            {files.length === 0 ? (
              <div className="flex-1 p-6">
                <DropZone />
              </div>
            ) : (
              <FileList />
            )}
          </div>

          {files.length > 0 && (
            <div className="w-72">
              <ConversionPanel />
            </div>
          )}
        </>
      ) : (
        <div className="flex-1">
          <History />
        </div>
      )}

      {/* Preview Modal */}
      <Preview />
    </div>
  )
}
