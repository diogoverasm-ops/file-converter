import React, { useEffect, useCallback, useState, useMemo } from 'react'
import {
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react'
import { useConverterStore } from '../store/converterStore'
import { formatFileSize } from '../types'
import type { HistoryEntry } from '../types'

type HistoryFilter = 'all' | 'success' | 'failed'

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function HistoryItem({ entry }: { entry: HistoryEntry }): React.ReactElement {
  const inputName = entry.inputFile.split(/[\\/]/).pop() || entry.inputFile
  const outputName = entry.outputFile ? entry.outputFile.split(/[\\/]/).pop() || '' : ''

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary border border-border hover:border-border-hover transition-colors">
      <div className="flex-shrink-0">
        {entry.success ? (
          <CheckCircle2 size={16} className="text-green-400" />
        ) : (
          <AlertCircle size={16} className="text-red-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300 truncate">{inputName}</p>

        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs font-mono text-gray-400 uppercase">{entry.inputFormat}</span>
          <ArrowRight size={10} className="text-accent flex-shrink-0" />
          <span className="text-xs font-mono text-accent uppercase">{entry.outputFormat}</span>
        </div>

        {entry.error && (
          <p className="text-xs text-red-400 mt-0.5 truncate">{entry.error}</p>
        )}

        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-600">{formatFileSize(entry.fileSize)}</span>
          <span className="text-xs text-gray-600">{formatTime(entry.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

export function History(): React.ReactElement {
  const history = useConverterStore((s) => s.history)
  const setHistory = useConverterStore((s) => s.setHistory)
  const clearHistory = useConverterStore((s) => s.clearHistory)
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [search, setSearch] = useState('')

  const loadHistory = useCallback(async () => {
    const data = await window.api.historyGet()
    setHistory(data)
  }, [setHistory])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleClear = useCallback(async () => {
    await window.api.historyClear()
    clearHistory()
  }, [clearHistory])

  const successCount = history.filter((h) => h.success).length
  const failCount = history.filter((h) => !h.success).length

  const filteredHistory = useMemo(() => {
    let result = history
    if (filter === 'success') result = result.filter((h) => h.success)
    if (filter === 'failed') result = result.filter((h) => !h.success)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((h) => {
        const name = h.inputFile.split(/[\\/]/).pop() || ''
        return name.toLowerCase().includes(q)
      })
    }
    return result
  }, [history, filter, search])

  const filterButtons: { label: string; value: HistoryFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Success', value: 'success' },
    { label: 'Failed', value: 'failed' }
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <h2 className="text-sm font-medium text-gray-300">Conversion History</h2>
          <span className="text-xs text-gray-500 bg-bg-tertiary px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadHistory}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-md transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-bg-tertiary rounded-md transition-colors"
              title="Clear history"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="flex flex-col gap-2 px-4 py-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {filterButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFilter(btn.value)}
                  className={`
                    px-3 py-1 text-xs rounded-md transition-colors
                    ${filter === btn.value
                      ? 'bg-accent/20 text-accent'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-bg-tertiary'}
                  `}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-green-400" />
                <span className="text-xs text-gray-400">{successCount}</span>
              </div>
              {failCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={12} className="text-red-400" />
                  <span className="text-xs text-gray-400">{failCount}</span>
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename..."
              className="w-full bg-bg-tertiary border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <Clock size={40} className="opacity-30" />
            <p className="text-sm">No conversions yet</p>
            <p className="text-xs text-gray-600">Your conversion history will appear here</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
            <Search size={32} className="opacity-30" />
            <p className="text-sm">No matching results</p>
          </div>
        ) : (
          filteredHistory.map((entry) => <HistoryItem key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  )
}
