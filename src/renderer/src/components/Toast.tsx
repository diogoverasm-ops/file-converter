import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useConverterStore } from '../store/converterStore'

const ICON_MAP = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
}

const COLOR_MAP = {
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  info: 'border-accent/30 bg-accent/10 text-accent'
}

function ToastItem({ id, message, type }: { id: string; message: string; type: 'success' | 'error' | 'info' }): React.ReactElement {
  const removeToast = useConverterStore((s) => s.removeToast)
  const Icon = ICON_MAP[type]

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 3000)
    return () => clearTimeout(timer)
  }, [id, removeToast])

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm animate-slide-up ${COLOR_MAP[type]}`}>
      <Icon size={16} className="flex-shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      <button onClick={() => removeToast(id)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer(): React.ReactElement {
  const toasts = useConverterStore((s) => s.toasts)

  if (toasts.length === 0) return <></>

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  )
}
