import { useState } from 'react'
import { Youtube, Loader2, Download, Music, Video } from 'lucide-react'
import { useStore } from '../store'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

interface VideoInfo {
  title: string
  author: string
  durationSeconds: number
  lengthBytes?: number
  thumbnail: string
}

type DownloadKind = 'video' | 'audio'

export function YouTubePanel() {
  const addToast = useStore((s) => s.addToast)
  const [url, setUrl] = useState('')
  const [info, setInfo] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<DownloadKind | null>(null)

  async function fetchInfo() {
    if (!url.trim()) return
    setLoading(true)
    setInfo(null)
    try {
      const res = await fetch(`${API_BASE}/api/youtube/info?url=${encodeURIComponent(url.trim())}`)
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load video info')
      const data = (await res.json()) as VideoInfo
      setInfo(data)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to load video', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function download(kind: DownloadKind) {
    if (!url.trim()) return
    setDownloading(kind)
    try {
      const endpoint = `${API_BASE}/api/youtube/download?kind=${kind}&url=${encodeURIComponent(url.trim())}`
      const res = await fetch(endpoint)
      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || 'Download failed')
      }
      const blob = await res.blob()
      const dispo = res.headers.get('Content-Disposition') || ''
      const filename = decodeURIComponent(dispo.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/)?.[1] || '') ||
        `${info?.title || 'video'}.${kind === 'audio' ? 'mp3' : 'mp4'}`

      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      addToast(`Downloaded ${filename}`, 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Download failed', 'error')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      <div className="flex items-center gap-2">
        <Youtube className="text-red-500" />
        <h2 className="text-lg font-semibold">YouTube Downloader</h2>
      </div>

      <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
        Downloading content from YouTube may violate their Terms of Service. Only download content
        you own, that is in the public domain, or that is licensed under Creative Commons.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
          className="flex-1 bg-bg-secondary border border-border rounded-xl px-3 py-3 text-sm"
        />
        <button
          onClick={fetchInfo}
          disabled={loading || !url.trim()}
          className="bg-accent disabled:opacity-50 rounded-xl px-4"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Load'}
        </button>
      </div>

      {info && (
        <div className="bg-bg-secondary border border-border rounded-xl p-3 flex gap-3">
          <img
            src={info.thumbnail}
            alt=""
            className="w-24 h-24 object-cover rounded-lg shrink-0 bg-bg-tertiary"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium line-clamp-2">{info.title}</p>
            <p className="text-xs text-gray-400 mt-1">{info.author}</p>
            <p className="text-xs text-gray-500">{formatDuration(info.durationSeconds)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => download('video')}
          disabled={!url.trim() || downloading !== null}
          className="bg-accent hover:bg-accent/90 disabled:opacity-50 rounded-xl py-3 font-medium flex items-center justify-center gap-2"
        >
          {downloading === 'video' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Video size={18} />
          )}
          Video MP4
        </button>
        <button
          onClick={() => download('audio')}
          disabled={!url.trim() || downloading !== null}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl py-3 font-medium flex items-center justify-center gap-2"
        >
          {downloading === 'audio' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Music size={18} />
          )}
          Audio MP3
        </button>
      </div>

      {downloading && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Download size={14} /> Downloading… browsers won't show progress until the file is ready.
        </p>
      )}
    </div>
  )
}

function formatDuration(s: number): string {
  if (!s || Number.isNaN(s)) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const parts = h > 0 ? [h, m, sec] : [m, sec]
  return parts.map((n, i) => (i === 0 ? n : String(n).padStart(2, '0'))).join(':')
}
