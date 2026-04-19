import { useStore } from './store'
import { TabBar } from './components/TabBar'
import { DropZone } from './components/DropZone'
import { FileList } from './components/FileList'
import { ConvertBar } from './components/ConvertBar'
import { YouTubePanel } from './components/YouTubePanel'
import { ToastContainer } from './components/Toast'

export default function App() {
  const view = useStore((s) => s.view)
  const files = useStore((s) => s.files)

  return (
    <div className="flex flex-col h-full">
      <TabBar />
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {view === 'convert' ? (
          files.length === 0 ? (
            <DropZone />
          ) : (
            <FileList />
          )
        ) : (
          <YouTubePanel />
        )}
      </main>
      {view === 'convert' && <ConvertBar />}
      <ToastContainer />
    </div>
  )
}
