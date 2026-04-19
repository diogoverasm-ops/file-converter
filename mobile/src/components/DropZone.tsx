import { useRef, useState } from 'react'
import { Upload, Camera } from 'lucide-react'
import { useStore } from '../store'

export function DropZone() {
  const addFiles = useStore((s) => s.addFiles)
  const addToast = useStore((s) => s.addToast)
  const fileInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    const before = useStore.getState().files.length
    addFiles(list)
    const added = useStore.getState().files.length - before
    if (added === 0) addToast('No supported files were added', 'error')
    else addToast(`Added ${added} file${added > 1 ? 's' : ''}`, 'success')
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={`flex-1 flex flex-col items-center justify-center text-center gap-6 p-6 m-4 rounded-3xl border-2 border-dashed transition-colors ${
        isDragging ? 'border-accent bg-accent/10' : 'border-border bg-bg-secondary/40'
      }`}
    >
      <div className="w-20 h-20 rounded-2xl bg-accent/15 flex items-center justify-center">
        <Upload className="text-accent" size={36} />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Pick files to convert</h2>
        <p className="text-sm text-gray-400 mt-1 max-w-xs">
          Video, audio or image. Everything stays on your device.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => fileInput.current?.click()}
          className="bg-accent hover:bg-accent/90 text-white font-medium rounded-xl py-3"
        >
          Browse files
        </button>
        <button
          onClick={() => cameraInput.current?.click()}
          className="bg-bg-tertiary hover:bg-bg-tertiary/80 text-white font-medium rounded-xl py-3 flex items-center justify-center gap-2"
        >
          <Camera size={18} /> Use camera
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
