// Copies the desktop app icons into mobile/public/icons so the PWA manifest
// finds them. Run with: `node scripts/copy-icons.js`
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const sourceDir = resolve(root, '..', 'resources')
const targetDir = resolve(root, 'public', 'icons')

mkdirSync(targetDir, { recursive: true })

const map = [
  { from: 'icon-256.png', to: 'icon-192.png' },
  { from: 'icon-512.png', to: 'icon-512.png' }
]

for (const { from, to } of map) {
  const src = resolve(sourceDir, from)
  if (!existsSync(src)) {
    console.warn(`Skipping ${from} (not found at ${src})`)
    continue
  }
  copyFileSync(src, resolve(targetDir, to))
  console.log(`Copied ${from} -> ${to}`)
}
