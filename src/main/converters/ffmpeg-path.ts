import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import path from 'path'

export function resolveFfmpegPath(): string {
  const rawPath = ffmpegInstaller.path
  if (rawPath.includes('app.asar' + path.sep) || rawPath.includes('app.asar/')) {
    return rawPath.replace(/app\.asar([/\\])/g, 'app.asar.unpacked$1')
  }
  return rawPath
}
