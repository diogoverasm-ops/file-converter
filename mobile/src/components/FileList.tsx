import { Trash2, Download, FileVideo, FileAudio, FileImage, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useStore } from '../store'
import { formatSize } from '../types'

const CATEGORY_ICONS = {
  video: FileVideo,
  audio: FileAudio,
  image: FileImage
}

export function FileList() {
  const files = useStore((s) => s.files)
  const remove = useStore((s) => s.removeFile)
  const isConverting = useStore((s) => s.isConverting)

  return (
    <ul className="flex flex-col gap-2 px-4 py-2">
      {files.map((f) => {
        const Icon = CATEGORY_ICONS[f.category]
        return (
          <li
            key={f.id}
            className="bg-bg-secondary border border-border rounded-xl p-3 flex flex-col gap-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center shrink-0">
                <Icon size={18} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-gray-400">
                  {f.category} · {formatSize(f.size)}
                </p>
              </div>
              <StatusBadge status={f.status} />
              {!isConverting && (
                <button
                  onClick={() => remove(f.id)}
                  className="text-gray-500 hover:text-red-400 p-1"
                  aria-label="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {(f.status === 'converting' || f.progress > 0) && (
              <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    f.status === 'error' ? 'bg-red-500' : 'bg-accent'
                  }`}
                  style={{ width: `${f.progress}%` }}
                />
              </div>
            )}

            {f.error && <p className="text-xs text-red-400">{f.error}</p>}

            {f.status === 'done' && f.outputBlob && f.outputName && (
              <DownloadButton blob={f.outputBlob} name={f.outputName} />
            )}
          </li>
        )
      })}
    </ul>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'converting' | 'done' | 'error' }) {
  switch (status) {
    case 'converting':
      return <Loader2 size={16} className="text-accent animate-spin" />
    case 'done':
      return <CheckCircle size={16} className="text-emerald-400" />
    case 'error':
      return <AlertCircle size={16} className="text-red-400" />
    default:
      return null
  }
}

function DownloadButton({ blob, name }: { blob: Blob; name: string }) {
  function save() {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <button
      onClick={save}
      className="self-start text-sm bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 rounded-lg px-3 py-1.5 flex items-center gap-1.5"
    >
      <Download size={14} /> Save {name}
    </button>
  )
}
