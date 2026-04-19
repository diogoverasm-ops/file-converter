# File Converter Mobile

Mobile-first **Progressive Web App** that converts video, audio and image files
directly on your phone, plus an optional YouTube media downloader served by a
small Node backend.

## What it does

- **In-browser conversion** using [`ffmpeg.wasm`](https://github.com/ffmpegwasm/ffmpeg.wasm)
  for video/audio, and the Canvas API for image formats. Files never leave your
  device.
- **Camera capture** to convert photos/videos taken on the phone.
- **PWA** with a manifest and service worker so it can be installed to the home
  screen on Android (Chrome) and iOS (Safari → "Add to Home Screen").
- **YouTube downloader** (video MP4 / audio M4A) backed by `@distube/ytdl-core`.
  Requires the bundled Express server.

## Tech stack

- Vite + React 18 + TypeScript + Tailwind CSS
- `@ffmpeg/ffmpeg` (WASM build) for media conversion in the browser
- `@distube/ytdl-core` + Express for YouTube downloads
- `vite-plugin-pwa` (Workbox) for installability + offline caching

## Project layout

```
mobile/
├── public/             # PWA icons, favicon
├── server/index.js     # Express server (YouTube + serves built PWA)
├── src/
│   ├── components/     # UI (TabBar, DropZone, FileList, ConvertBar, YouTubePanel, Toast)
│   ├── converters/     # ffmpeg + canvas conversion logic
│   ├── App.tsx
│   ├── main.tsx
│   ├── store.ts        # zustand store
│   └── types.ts
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Getting started

```bash
cd mobile
npm install
node scripts/copy-icons.js   # one-time: pulls icons from ../resources
```

### Development

```bash
# Terminal 1 — Vite dev server (auto-reloads, proxies /api to :8787)
npm run dev

# Terminal 2 — YouTube/Express backend
npm run server
```

Open the printed network URL on your phone (e.g. `http://192.168.1.20:5173`).
Both devices must be on the same Wi-Fi network.

### Production build / single-process server

```bash
npm run build      # outputs to mobile/dist/
npm run server     # serves /dist AND /api on http://<your-ip>:8787
# or, in one shot:
npm run start
```

### Installing on the phone

1. Open the URL in **Chrome (Android)** or **Safari (iOS)**.
2. Use the browser menu → "Install app" / "Add to Home Screen".
3. Launch from the home screen — it runs full-screen, like a native app.

## Important notes

### ffmpeg.wasm requires cross-origin isolation

`SharedArrayBuffer` only works when the page is served with these headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The Vite dev server and the Express production server already set them. If you
deploy elsewhere, configure the same headers.

### Phone storage limits

Browsers cap memory available to WASM. Very large videos (>500 MB) may fail to
convert — that's a hardware limit, not a code bug. Use shorter clips or convert
on the desktop app.

### YouTube ToS warning

Downloading YouTube content can violate the
[YouTube Terms of Service](https://www.youtube.com/t/terms). Only download:

- Content you own
- Public domain works
- Content explicitly licensed under Creative Commons or similar

The operator of the server is responsible for compliance. The backend is
provided for legitimate use cases (offline access to your own uploads, archival
of CC content, etc.).

YouTube also rate-limits/blocks scraping. If `ytdl-core` starts failing,
update the package — extractors break frequently.

## How conversion works

| Input        | Output target | Engine                        |
| ------------ | ------------- | ----------------------------- |
| video        | mp4/webm/mov/mkv | ffmpeg.wasm (libx264/libvpx) |
| video        | mp3/wav          | ffmpeg.wasm (audio extract)  |
| video        | gif              | ffmpeg.wasm (palette + scale) |
| audio        | mp3/wav/aac/ogg/opus/flac/m4a | ffmpeg.wasm |
| image        | png/jpg/webp     | Canvas API (`canvas.toBlob`) |

## License

Same as the parent repository.
