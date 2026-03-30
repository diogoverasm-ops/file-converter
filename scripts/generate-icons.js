const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const svgPath = path.join(__dirname, '..', 'resources', 'icon.svg')
const outDir = path.join(__dirname, '..', 'resources')

const sizes = [16, 32, 48, 64, 128, 256, 512]

async function generate() {
  const svgBuffer = fs.readFileSync(svgPath)

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`))
    console.log(`Generated icon-${size}.png`)
  }

  // Main icon.png (256x256 for electron-builder)
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(outDir, 'icon.png'))
  console.log('Generated icon.png')

  console.log('Done! Icons generated in resources/')
}

generate().catch(console.error)
