import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { convertFile, getPreview } from './converters'

interface HistoryEntry {
  id: string
  inputFile: string
  inputFormat: string
  outputFile: string
  outputFormat: string
  timestamp: number
  success: boolean
  error?: string
  fileSize: number
}

function getHistoryPath(): string {
  return join(app.getPath('userData'), 'history.json')
}

function loadHistory(): HistoryEntry[] {
  try {
    const data = fs.readFileSync(getHistoryPath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveHistory(history: HistoryEntry[]): void {
  fs.writeFileSync(getHistoryPath(), JSON.stringify(history, null, 2), 'utf-8')
}

function addHistoryEntry(entry: HistoryEntry): void {
  const history = loadHistory()
  history.unshift(entry)
  if (history.length > 500) history.length = 500
  saveHistory(history)
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f0f0f',
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? false : true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function setupIpcHandlers(): void {
  ipcMain.handle('dialog:openFiles', async () => {
    if (!mainWindow) return []
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'All Supported',
          extensions: [
            'mp4', 'avi', 'mov', 'mkv', 'webm',
            'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a',
            'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'avif',
            'docx', 'pdf', 'txt', 'html', 'md',
            'csv', 'json', 'xml', 'yaml', 'yml'
          ]
        },
        { name: 'Video', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm'] },
        { name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'] },
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'avif'] },
        { name: 'Documents', extensions: ['docx', 'pdf', 'txt', 'html', 'md'] },
        { name: 'Data', extensions: ['csv', 'json', 'xml', 'yaml', 'yml'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle('dialog:openDir', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('convert:start', async (_event, request: {
    files: Array<{ id: string; path: string; name: string }>
    outputFormat: string
    outputDir: string
  }) => {
    const { files, outputFormat, outputDir } = request

    for (const file of files) {
      try {
        const outputPath = await convertFile({
          inputPath: file.path,
          outputFormat,
          outputDir,
          onProgress: (percent) => {
            mainWindow?.webContents.send('convert:progress', {
              fileId: file.id,
              percent
            })
          }
        })

        const stats = fs.statSync(file.path)
        addHistoryEntry({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          inputFile: file.path,
          inputFormat: file.name.split('.').pop() || '',
          outputFile: outputPath,
          outputFormat,
          timestamp: Date.now(),
          success: true,
          fileSize: stats.size
        })

        mainWindow?.webContents.send('convert:done', {
          fileId: file.id,
          outputPath,
          success: true
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'

        const stats = fs.existsSync(file.path) ? fs.statSync(file.path) : { size: 0 }
        addHistoryEntry({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          inputFile: file.path,
          inputFormat: file.name.split('.').pop() || '',
          outputFile: '',
          outputFormat,
          timestamp: Date.now(),
          success: false,
          error: errorMsg,
          fileSize: stats.size
        })

        mainWindow?.webContents.send('convert:done', {
          fileId: file.id,
          outputPath: '',
          success: false,
          error: errorMsg
        })
      }
    }
  })

  ipcMain.handle('history:get', async () => {
    return loadHistory()
  })

  ipcMain.handle('history:clear', async () => {
    saveHistory([])
  })

  ipcMain.handle('preview:get', async (_event, filePath: string) => {
    return getPreview(filePath)
  })
}
