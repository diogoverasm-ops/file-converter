import { useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useStore } from '../store'

export function ToastContainer() {
  const toasts = useStore((s) => s.toasts)
  const remove = useStore((s) => s.removeToast)

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[92vw] max-w-md">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onClose={() => remove(t.id)} />
      ))}
    </div>
  )
}

function ToastItem({
  id,
  message,
  type,
  onClose
}: {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [id, onClose])

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info
  const color =
    type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-red-400' : 'text-sky-400'

  return (
    <div className="flex items-start gap-2 bg-bg-secondary border border-border rounded-xl p-3 shadow-lg">
      <Icon size={18} className={`shrink-0 mt-0.5 ${color}`} />
      <p className="text-sm flex-1 break-words">{message}</p>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
        <X size={16} />
      </button>
    </div>
  )
}
