import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import fs from 'fs'
import fsPromises from 'fs/promises'
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

async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const data = await fsPromises.readFile(getHistoryPath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveHistory(history: HistoryEntry[]): Promise<void> {
  await fsPromises.writeFile(getHistoryPath(), JSON.stringify(history, null, 2), 'utf-8')
}

async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const history = await loadHistory()
  history.unshift(entry)
  if (history.length > 500) history.length = 500
  await saveHistory(history)
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f0f0f',
    icon: join(__dirname, '../../resources/icon.png'),
    titleBarStyle: 'hiddenInset',
    frame: false,
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
            'mp4', 'avi', 'mov', 'mkv', 'webm', 'm4v', 'mpeg', 'mpg', 'wmv', 'ts', 'ogv', 'av1', '3gp', 'divx', 'mjpeg', 'vob', 'flv', 'mts', 'mxf', '3g2', 'asf', 'xvid', 'rmvb', 'f4v', 'm2v', 'm2ts', 'rm', 'wtv', 'hevc', 'swf',
            'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a',
            'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'avif',
            'docx', 'pdf', 'txt', 'html', 'md',
            'csv', 'json', 'xml', 'yaml', 'yml'
          ]
        },
        { name: 'Video', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'm4v', 'mpeg', 'mpg', 'wmv', 'ts', 'ogv', 'av1', '3gp', 'divx', 'mjpeg', 'vob', 'flv', 'mts', 'mxf', '3g2', 'asf', 'xvid', 'rmvb', 'f4v', 'm2v', 'm2ts', 'rm', 'wtv', 'hevc', 'swf'] },
        { name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'm4r', 'wma', 'opus', 'mp2', 'aiff', 'aif', 'amr', '8svx', 'au', 'ac3', 'dts', 'caf', 'oga', 'voc', 'avr', 'wv', 'snd', 'spx', 'amb', 'w64', 'tta', 'gsm', 'cdda', 'cvs', 'vms', 'smp', 'ima', 'hcom', 'vox', 'ra', 'wve', 'cvu', 'txw', 'fap', 'sou', 'cvsd', 'sln', 'prc', 'pvf', 'paf', 'dvms', 'sph', 'sd2', 'maud', 'sndr', 'sndt', 'fssd', 'gsrt', 'htk', 'ircam', 'nist'] },
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'avif', 'heic', 'heif', 'jp2', 'jfif', 'jpe', 'jfi', 'exr', 'xbm', 'xpm', 'pgm', 'ppm', 'pnm', 'pbm', 'pam', 'pcx', 'tga', 'sgi', 'ras', 'sun', 'pict', 'pct', 'pcd', 'pfm', 'xwd', 'mng', 'yuv', 'uyvy', 'rgbo', 'rgba', 'g3', 'g4', 'palm', 'mtv', 'viff', 'xv', 'ipl', 'hrz', 'jps', 'pgx', 'picon', 'wbmp', 'jbg', 'jbig', 'map', 'six', 'sixel', 'fax', 'otb', 'rgf', 'vips', 'fts', 'pal', 'pdb', 'svg', 'ai', 'eps', 'ps', 'plt', 'emf', 'wmf', 'sk', 'fig', 'cgm', 'sk1'] },
        { name: 'Documents', extensions: ['docx', 'doc', 'docm', 'dotx', 'dotm', 'dot', 'pdf', 'txt', 'html', 'md', 'rtf', 'odt', 'sxw', 'xps', 'djvu', 'aw', 'kwd', 'dbk'] },
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
        await addHistoryEntry({
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
        await addHistoryEntry({
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
    await saveHistory([])
  })

  ipcMain.handle('preview:get', async (_event, filePath: string) => {
    return getPreview(filePath)
  })

  ipcMain.handle('files:getStats', async (_event, paths: string[]) => {
    return paths.map((p) => {
      try {
        const stats = fs.statSync(p)
        return { path: p, size: stats.size }
      } catch {
        return { path: p, size: 0 }
      }
    })
  })

  ipcMain.handle('shell:openFile', async (_event, filePath: string) => {
    await shell.openPath(filePath)
  })

  ipcMain.handle('shell:showInFolder', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })
}
