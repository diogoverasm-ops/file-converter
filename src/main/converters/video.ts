import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import { resolveFfmpegPath } from './ffmpeg-path'

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
      // Audio
      case 'mp3':
        command = command.audioCodec('libmp3lame').audioBitrate('192k')
        break
      case 'wav':
      case 'w64':
      case 'amb':
      case 'sln':
      case 'htk':
      case 'ircam':
      case 'nist':
      case 'sph':
      case 'gsrt':
        command = command.audioCodec('pcm_s16le')
        break
      case 'flac':
        command = command.audioCodec('flac')
        break
      case 'aac':
      case 'm4a':
      case 'm4r':
        command = command.audioCodec('aac').audioBitrate('192k')
        break
      case 'ogg':
      case 'oga':
      case 'spx':
        command = command.audioCodec('libvorbis').audioBitrate('192k')
        break
      case 'opus':
        command = command.audioCodec('libopus').audioBitrate('128k')
        break
      case 'wma':
        command = command.audioCodec('wmav2').audioBitrate('192k')
        break
      case 'mp2':
        command = command.audioCodec('mp2').audioBitrate('192k')
        break
      case 'aiff':
      case 'aif':
      case 'au':
      case 'snd':
      case 'avr':
        command = command.audioCodec('pcm_s16be')
        break
      case 'ac3':
        command = command.audioCodec('ac3').audioBitrate('192k')
        break
      case 'dts':
        command = command.audioCodec('dca').audioBitrate('768k')
        break
      case 'caf':
        command = command.audioCodec('pcm_s16le').format('caf')
        break
      case 'wv':
        command = command.audioCodec('wavpack')
        break
      case 'tta':
        command = command.audioCodec('tta')
        break
      case 'amr':
        command = command.audioCodec('libopencore_amrnb').audioBitrate('12k')
        break
      case 'gsm':
        command = command.audioCodec('gsm')
        break
      case 'voc':
        command = command.audioCodec('pcm_u8')
        break
      case 'sd2':
      case 'maud':
      case 'sndr':
      case 'sndt':
      case 'fssd':
      case 'dvms':
      case 'smp':
      case 'vms':
      case 'paf':
      case 'pvf':
      case 'sou':
      case 'ima':
        command = command.audioCodec('pcm_s16le').format('wav')
        break
      // H.264 containers
      case 'mp4':
        command = command.videoCodec('libx264').audioCodec('aac').addOutputOption('-pix_fmt yuv420p')
        break
      case 'mov':
      case 'm4v':
        command = command.videoCodec('libx264').audioCodec('aac').addOutputOption('-pix_fmt yuv420p').addOutputOption('-movflags +faststart')
        break
      case 'mkv':
      case 'ts':
      case 'mts':
      case 'm2ts':
        command = command.videoCodec('libx264').audioCodec('aac')
        break
      case '3gp':
      case '3g2':
        command = command.videoCodec('libx264').audioCodec('aac').addOutputOption('-movflags +faststart')
        break
      case 'f4v':
      case 'flv':
        command = command.videoCodec('flv').audioCodec('libmp3lame').audioBitrate('128k')
        break
      // H.265 / HEVC
      case 'hevc':
        command = command.videoCodec('libx265').audioCodec('aac').addOutputOption('-tag:v hvc1')
        break
      // WebM / VP9
      case 'webm':
        command = command
          .videoCodec('libvpx-vp9')
          .videoBitrate('0')
          .addOutputOption('-crf 30')
          .audioCodec('libopus')
          .audioBitrate('128k')
        break
      // AV1
      case 'av1':
        command = command
          .videoCodec('libaom-av1')
          .addOutputOption('-crf 30')
          .addOutputOption('-b:v 0')
          .audioCodec('libopus')
          .audioBitrate('128k')
        break
      // Windows Media
      case 'wmv':
      case 'asf':
        command = command.videoCodec('wmv2').audioCodec('wmav2')
        break
      case 'wtv':
        command = command.videoCodec('mpeg2video').audioCodec('wmav2')
        break
      // MPEG
      case 'mpeg':
      case 'mpg':
        command = command.videoCodec('mpeg2video').audioCodec('mp2')
        break
      case 'm2v':
        command = command.videoCodec('mpeg2video').noAudio()
        break
      case 'vob':
        command = command.videoCodec('mpeg2video').audioCodec('ac3')
        break
      // DivX / Xvid (MPEG-4)
      case 'avi':
      case 'divx':
        command = command.videoCodec('mpeg4').audioCodec('libmp3lame').audioBitrate('192k')
        break
      case 'xvid':
        command = command.videoCodec('mpeg4').audioCodec('libmp3lame').audioBitrate('192k').addOutputOption('-vtag XVID')
        break
      // OGV
      case 'ogv':
        command = command.videoCodec('libtheora').audioCodec('libvorbis')
        break
      // MXF
      case 'mxf':
        command = command.videoCodec('mpeg2video').audioCodec('pcm_s16le')
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
