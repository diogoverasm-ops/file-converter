import React from 'react'
import { Minus, Square, X } from 'lucide-react'
import iconSvg from '../assets/icon.svg'

export function TitleBar(): React.ReactElement | null {
  if (window.api.platform === 'darwin') return null

  return (
    <div className="h-8 flex items-center justify-between bg-bg-secondary border-b border-border select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 pl-3">
        <img src={iconSvg} alt="File Converter" className="w-4 h-4" />
        <span className="text-xs text-gray-400 font-medium">File Converter</span>
      </div>

      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => window.api.windowMinimize()}
          className="w-11 h-full flex items-center justify-center text-gray-400 hover:bg-bg-tertiary hover:text-white transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => window.api.windowMaximize()}
          className="w-11 h-full flex items-center justify-center text-gray-400 hover:bg-bg-tertiary hover:text-white transition-colors"
        >
          <Square size={10} />
        </button>
        <button
          onClick={() => window.api.windowClose()}
          className="w-11 h-full flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
