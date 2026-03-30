import React, { useCallback, useMemo } from 'react'
import { FolderOpen, Play, Loader2, CheckCircle2 } from 'lucide-react'
import { useConverterStore } from '../store/converterStore'
import { OUTPUT_FORMATS } from '../types'
import type { FileCategory } from '../types'

export function ConversionPanel(): React.ReactElement {
  const files = useConverterStore((s) => s.files)
  const outputFormat = useConverterStore((s) => s.outputFormat)
  const outputDir = useConverterStore((s) => s.outputDir)
  const isConverting = useConverterStore((s) => s.isConverting)
  const setOutputFormat = useConverterStore((s) => s.setOutputFormat)
  const setOutputDir = useConverterStore((s) => s.setOutputDir)
  const startConversion = useConverterStore((s) => s.startConversion)
  const getFilesCategory = useConverterStore((s) => s.getFilesCategory)

  const category = getFilesCategory()
  const doneCount = files.filter((f) => f.status === 'done').length
  const errorCount = files.filter((f) => f.status === 'error').length
  const allDone = files.length > 0 && doneCount + errorCount === files.length

  const availableFormats = useMemo(() => {
    if (!category || category === 'mixed') {
      return Object.values(OUTPUT_FORMATS).flat()
    }
    return OUTPUT_FORMATS[category as FileCategory] || []
  }, [category])

  const handleSelectDir = useCallback(async () => {
    const dir = await window.api.dialogOpenDir()
    if (dir) setOutputDir(dir)
  }, [setOutputDir])

  const handleConvert = useCallback(() => {
    startConversion()
  }, [startConversion])

  const canConvert = files.length > 0 && outputFormat && !isConverting && !allDone

  return (
    <div className="flex flex-col h-full border-l border-border">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium text-gray-300">Conversion Settings</h2>
      </div>

      <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        {/* Output Format */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Output Format
          </label>
          {category && category !== 'mixed' ? (
            <div className="grid grid-cols-2 gap-1.5">
              {availableFormats.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  disabled={isConverting}
                  className={`
                    px-3 py-2 text-xs font-mono rounded-lg border transition-all
                    ${
                      outputFormat === fmt
                        ? 'bg-accent/20 border-accent text-accent-hover'
                        : 'bg-bg-tertiary border-border text-gray-400 hover:border-border-hover hover:text-gray-300'
                    }
                    disabled:opacity-50
                  `}
                >
                  .{fmt}
                </button>
              ))}
            </div>
          ) : category === 'mixed' ? (
            <div>
              <p className="text-xs text-yellow-400 mb-2">
                Mixed file types detected. Select files of the same type for format options.
              </p>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-accent"
              >
                <option value="">Select format...</option>
                {availableFormats.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    .{fmt}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Add files to see format options</p>
          )}
        </div>

        {/* Output Directory */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Output Directory
          </label>
          <button
            onClick={handleSelectDir}
            disabled={isConverting}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg text-sm text-gray-400 hover:border-border-hover hover:text-gray-300 transition-colors disabled:opacity-50 text-left"
          >
            <FolderOpen size={14} />
            <span className="truncate flex-1">
              {outputDir || 'Same as source (default)'}
            </span>
          </button>
        </div>

        {/* Summary */}
        {files.length > 0 && (
          <div className="p-3 bg-bg-tertiary rounded-xl border border-border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Files</span>
              <span className="text-gray-300">{files.length}</span>
            </div>
            {outputFormat && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Output</span>
                <span className="text-accent font-mono">.{outputFormat}</span>
              </div>
            )}
            {isConverting && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Progress</span>
                <span className="text-gray-300">
                  {doneCount + errorCount}/{files.length}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Convert Button */}
      <div className="p-4 border-t border-border">
        {allDone ? (
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            <CheckCircle2 size={18} />
            <span>
              {doneCount} converted{errorCount > 0 ? `, ${errorCount} failed` : ''}
            </span>
          </div>
        ) : (
          <button
            onClick={handleConvert}
            disabled={!canConvert}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all
              ${
                canConvert
                  ? 'bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20'
                  : 'bg-bg-tertiary text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isConverting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Play size={18} />
                Convert {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : ''}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
