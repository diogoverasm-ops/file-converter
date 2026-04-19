import { useEffect } from 'react'
import { Play, Trash } from 'lucide-react'
import { useStore } from '../store'
import { CATEGORY_OUTPUT } from '../types'
import { convertFile } from '../converters'

export function ConvertBar() {
  const files = useStore((s) => s.files)
  const isConverting = useStore((s) => s.isConverting)
  const outputFormat = useStore((s) => s.outputFormat)
  const setOutputFormat = useStore((s) => s.setOutputFormat)
  const filesCategory = useStore((s) => s.filesCategory)
  const clearFiles = useStore((s) => s.clearFiles)
  const setProgress = useStore((s) => s.setProgress)
  const setStatus = useStore((s) => s.setStatus)
  const setOutput = useStore((s) => s.setOutput)
  const setConverting = useStore((s) => s.setConverting)
  const addToast = useStore((s) => s.addToast)

  const category = filesCategory()
  const formats =
    category && category !== 'mixed' ? CATEGORY_OUTPUT[category] : []

  useEffect(() => {
    if (formats.length === 0) {
      if (outputFormat) setOutputFormat('')
      return
    }
    if (!formats.includes(outputFormat)) setOutputFormat(formats[0])
  }, [formats.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    if (!outputFormat) {
      addToast('Pick an output format first', 'error')
      return
    }
    setConverting(true)
    let okCount = 0
    let errCount = 0
    for (const f of useStore.getState().files) {
      try {
        setProgress(f.id, 0)
        const result = await convertFile(f, outputFormat, (p) => setProgress(f.id, p))
        setOutput(f.id, result.blob, result.outputName)
        setStatus(f.id, 'done')
        okCount++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setStatus(f.id, 'error', msg)
        errCount++
      }
    }
    setConverting(false)
    if (okCount && !errCount) addToast(`Converted ${okCount} file(s)`, 'success')
    else if (okCount && errCount) addToast(`${okCount} done, ${errCount} failed`, 'info')
    else addToast('All conversions failed', 'error')
  }

  if (files.length === 0) return null

  return (
    <div
      className="sticky bottom-0 bg-bg-primary/95 backdrop-blur border-t border-border p-3 flex flex-col gap-2"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      {category === 'mixed' && (
        <p className="text-xs text-amber-400">
          Mixed file types — remove some so all files share a category.
        </p>
      )}
      <div className="flex items-center gap-2">
        <select
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value)}
          disabled={category === 'mixed' || isConverting}
          className="flex-1 bg-bg-secondary border border-border rounded-xl px-3 py-3 text-sm disabled:opacity-50"
        >
          {formats.length === 0 && <option value="">No output formats</option>}
          {formats.map((f) => (
            <option key={f} value={f}>
              Convert to .{f}
            </option>
          ))}
        </select>
        <button
          onClick={clearFiles}
          disabled={isConverting}
          aria-label="Clear all files"
          className="p-3 rounded-xl bg-bg-secondary border border-border text-gray-400 disabled:opacity-50"
        >
          <Trash size={18} />
        </button>
      </div>
      <button
        onClick={start}
        disabled={isConverting || category === 'mixed' || !outputFormat}
        className="bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2"
      >
        <Play size={18} />
        {isConverting ? 'Converting…' : `Convert ${files.length} file${files.length > 1 ? 's' : ''}`}
      </button>
    </div>
  )
}
