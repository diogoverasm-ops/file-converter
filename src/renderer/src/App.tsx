import React, { useEffect } from 'react'
import { ArrowLeftRight, Clock } from 'lucide-react'
import iconSvg from './assets/icon.svg'
import { useConverterStore } from './store/converterStore'
import { DropZone } from './components/DropZone'
import { FileList } from './components/FileList'
import { ConversionPanel } from './components/ConversionPanel'
import { Preview } from './components/Preview'
import { History } from './components/History'
import { TitleBar } from './components/TitleBar'
import { ToastContainer } from './components/Toast'

export default function App(): React.ReactElement {
  const view = useConverterStore((s) => s.view)
  const setView = useConverterStore((s) => s.setView)
  const files = useConverterStore((s) => s.files)
  const setFileProgress = useConverterStore((s) => s.setFileProgress)
  const setFileStatus = useConverterStore((s) => s.setFileStatus)
  const addToast = useConverterStore((s) => s.addToast)

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
        const hasErrors = state.files.some((f) => f.id === fileId ? !success : f.status === 'error')
        const allSuccess = !hasErrors && (success || state.files.every((f) => f.id === fileId ? success : f.status === 'done'))
        if (allSuccess) {
          addToast('All conversions completed successfully', 'success')
        } else if (hasErrors) {
          addToast('Some conversions failed', 'error')
        }
      }
    })

    return () => {
      unsubProgress()
      unsubDone()
    }
  }, [setFileProgress, setFileStatus, addToast])

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-white">
      <TitleBar />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-[72px] flex flex-col items-center py-4 gap-1 border-r border-border bg-bg-secondary">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center overflow-hidden">
            <img src={iconSvg} alt="File Converter" className="w-7 h-7" />
          </div>

          <div className="w-10 border-t border-border my-2" />

          <button
            onClick={() => setView('converter')}
            className={`
              w-14 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all
              ${view === 'converter' ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300 hover:bg-bg-tertiary'}
            `}
          >
            <ArrowLeftRight size={18} />
            <span className="text-[10px] font-medium">Convert</span>
          </button>

          <button
            onClick={() => setView('history')}
            className={`
              w-14 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all
              ${view === 'history' ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300 hover:bg-bg-tertiary'}
            `}
          >
            <Clock size={18} />
            <span className="text-[10px] font-medium">History</span>
          </button>

          <div className="flex-1" />
          <span className="text-[9px] text-gray-600 font-mono">v1.0.0</span>
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
      </div>

      <Preview />
      <ToastContainer />
    </div>
  )
}
