import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import path from 'path'

function resolveFfmpegPath(): string {
  const rawPath = ffmpegInstaller.path
  if (rawPath.includes('app.asar' + path.sep) || rawPath.includes('app.asar/')) {
    return rawPath.replace(/app\.asar([/\\])/g, 'app.asar.unpacked$1')
  }
  return rawPath
}

ffmpeg.setFfmpegPath(resolveFfmpegPath())

export interface VideoConvertOptions {
  inputPath: string
  outputPath: string
  outputFormat: string
  onProgress?: (percent: number) => void
}

const AUDIO_FORMATS = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a']

export function convertMedia(options: VideoConvertOptions): Promise<string> {
  const { inputPath, outputPath, outputFormat, onProgress } = options

  return new Promise((resolve, reject) => {
    const inputExt = path.extname(inputPath).slice(1).toLowerCase()
    const isInputAudio = AUDIO_FORMATS.includes(inputExt)
    const isOutputAudio = AUDIO_FORMATS.includes(outputFormat)

    let command = ffmpeg(inputPath)

    if (isOutputAudio && !isInputAudio) {
      command = command.noVideo()
    }

    switch (outputFormat) {
      case 'mp3':
        command = command.audioCodec('libmp3lame').audioBitrate('192k')
        break
      case 'wav':
        command = command.audioCodec('pcm_s16le')
        break
      case 'flac':
        command = command.audioCodec('flac')
        break
      case 'aac':
      case 'm4a':
        command = command.audioCodec('aac').audioBitrate('192k')
        break
      case 'ogg':
        command = command.audioCodec('libvorbis').audioBitrate('192k')
        break
      case 'mp4':
        command = command.videoCodec('libx264').audioCodec('aac')
        break
      case 'webm':
        command = command
          .videoCodec('libvpx-vp9')
          .videoBitrate('0')
          .addOutputOption('-crf 30')
          .audioCodec('libopus')
          .audioBitrate('128k')
        break
      case 'avi':
        command = command.videoCodec('mpeg4').audioCodec('libmp3lame')
        break
      case 'mkv':
        command = command.videoCodec('libx264').audioCodec('aac')
        break
    }

    command
      .on('progress', (progress) => {
        const percent = progress.percent ?? 0
        onProgress?.(Math.min(Math.round(percent), 100))
      })
      .on('end', () => {
        onProgress?.(100)
        resolve(outputPath)
      })
      .on('error', (err) => {
        reject(new Error(`FFmpeg conversion failed: ${err.message}`))
      })
      .save(outputPath)
  })
}

export function getMediaThumbnail(inputPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tmpDir = require('os').tmpdir()
    const tmpFile = path.join(tmpDir, `thumb_${Date.now()}.png`)

    ffmpeg(inputPath)
      .on('end', () => {
        try {
          const fs = require('fs')
          const buffer = fs.readFileSync(tmpFile)
          fs.unlinkSync(tmpFile)
          resolve(buffer)
        } catch (err) {
          reject(new Error('Failed to read thumbnail'))
        }
      })
      .on('error', (err: Error) => {
        reject(new Error(`Thumbnail extraction failed: ${err.message}`))
      })
      .screenshots({
        count: 1,
        timemarks: ['00:00:01'],
        filename: path.basename(tmpFile),
        folder: tmpDir,
        size: '320x?'
      })
  })
}
