// Lightweight Express server that:
//   1. Serves the built PWA (mobile/dist) so phones can open it on the LAN.
//   2. Proxies YouTube video/audio downloads via @distube/ytdl-core.
//
// IMPORTANT: Downloading YouTube content may violate YouTube's Terms of Service.
// Operators are responsible for ensuring they only download content they own,
// public-domain works, or content licensed for redistribution.
import express from 'express'
import cors from 'cors'
import ytdl from '@distube/ytdl-core'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 8787)
const DIST_DIR = resolve(__dirname, '..', 'dist')

// Optional cookie agent — required when running on cloud IPs (Render, Fly,
// AWS, etc.) because YouTube aggressively rate-limits/blocks datacenter
// addresses with HTTP 429. Set YT_COOKIES to the JSON array exported by a
// browser cookie extension while logged into youtube.com.
const ytAgent = (() => {
  const raw = process.env.YT_COOKIES
  if (!raw) return undefined
  try {
    const cookies = JSON.parse(raw)
    if (!Array.isArray(cookies) || cookies.length === 0) return undefined
    console.log(`Loaded ${cookies.length} YouTube cookies for ytdl agent`)
    return ytdl.createAgent(cookies)
  } catch (err) {
    console.warn('YT_COOKIES is not valid JSON, ignoring:', err?.message)
    return undefined
  }
})()
const ytdlOptions = ytAgent ? { agent: ytAgent } : undefined

const app = express()
app.use(cors())
app.disable('x-powered-by')

// Required so SharedArrayBuffer (ffmpeg.wasm) works in the browser.
app.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  next()
})

function sanitizeFilename(name) {
  return (name || 'download')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 120)
    .trim()
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, version: '1.0.0' })
})

app.get('/api/youtube/info', async (req, res) => {
  const url = String(req.query.url || '')
  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' })
  }
  try {
    const info = await ytdl.getInfo(url, ytdlOptions)
    const details = info.videoDetails
    const thumbs = details.thumbnails || []
    res.json({
      title: details.title,
      author: details.author?.name || 'Unknown',
      durationSeconds: Number(details.lengthSeconds) || 0,
      thumbnail: thumbs[thumbs.length - 1]?.url || ''
    })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to load video' })
  }
})

app.get('/api/youtube/download', async (req, res) => {
  const url = String(req.query.url || '')
  const kind = req.query.kind === 'audio' ? 'audio' : 'video'

  if (!ytdl.validateURL(url)) {
    return res.status(400).type('text/plain').send('Invalid YouTube URL')
  }

  let info
  try {
    info = await ytdl.getInfo(url, ytdlOptions)
  } catch (err) {
    return res.status(500).type('text/plain').send(err?.message || 'Failed to load video')
  }

  const baseName = sanitizeFilename(info.videoDetails.title)
  const ext = kind === 'audio' ? 'm4a' : 'mp4'
  const filename = `${baseName}.${ext}`

  res.setHeader('Content-Type', kind === 'audio' ? 'audio/mp4' : 'video/mp4')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  )

  const filterOptions =
    kind === 'audio'
      ? { quality: 'highestaudio', filter: 'audioonly' }
      : { quality: 'highest', filter: (f) => f.hasVideo && f.hasAudio }

  const stream = ytdl.downloadFromInfo(info, { ...filterOptions, ...ytdlOptions })

  stream.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).type('text/plain').send(err?.message || 'Download failed')
    } else {
      res.end()
    }
  })

  req.on('close', () => stream.destroy())
  stream.pipe(res)
})

// Serve the built PWA if it exists.
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('*', (_req, res) => res.sendFile(resolve(DIST_DIR, 'index.html')))
} else {
  app.get('/', (_req, res) =>
    res
      .status(200)
      .type('text/plain')
      .send(
        'API is up. Build the PWA with `npm run build` to serve the web client from this server.'
      )
  )
}

app.listen(PORT, () => {
  console.log(`File Converter Mobile server listening on http://0.0.0.0:${PORT}`)
})
