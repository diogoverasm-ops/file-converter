import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),

  convertStart: (request: {
    files: Array<{ id: string; path: string; name: string }>
    outputFormat: string
    outputDir: string
  }) => ipcRenderer.invoke('convert:start', request),

  onConvertProgress: (callback: (data: { fileId: string; percent: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { fileId: string; percent: number }) => callback(data)
    ipcRenderer.on('convert:progress', handler)
    return () => ipcRenderer.removeListener('convert:progress', handler)
  },

  onConvertDone: (callback: (result: {
    fileId: string
    outputPath: string
    success: boolean
    error?: string
  }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, result: {
      fileId: string
      outputPath: string
      success: boolean
      error?: string
    }) => callback(result)
    ipcRenderer.on('convert:done', handler)
    return () => ipcRenderer.removeListener('convert:done', handler)
  },

  historyGet: () => ipcRenderer.invoke('history:get'),
  historyClear: () => ipcRenderer.invoke('history:clear'),
  dialogOpenFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  dialogOpenDir: () => ipcRenderer.invoke('dialog:openDir'),
  getPreview: (filePath: string) => ipcRenderer.invoke('preview:get', filePath),
  getFileStats: (paths: string[]) => ipcRenderer.invoke('files:getStats', paths),
  openFile: (path: string) => ipcRenderer.invoke('shell:openFile', path),
  showInFolder: (path: string) => ipcRenderer.invoke('shell:showInFolder', path)
})
