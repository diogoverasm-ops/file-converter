import fs from 'fs'
import path from 'path'
import mammoth from 'mammoth'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { marked } from 'marked'
import { htmlToText } from 'html-to-text'

export interface DocConvertOptions {
  inputPath: string
  outputPath: string
  outputFormat: string
  onProgress?: (percent: number) => void
}

async function readInputAsHtml(inputPath: string): Promise<string> {
  const ext = path.extname(inputPath).slice(1).toLowerCase()
  const raw = fs.readFileSync(inputPath)

  switch (ext) {
    case 'docx': {
      const result = await mammoth.convertToHtml({ buffer: raw })
      return result.value
    }
    case 'html':
      return raw.toString('utf-8')
    case 'md': {
      const md = raw.toString('utf-8')
      return await marked(md)
    }
    case 'txt':
      return `<pre>${raw.toString('utf-8')}</pre>`
    case 'pdf':
      return '<p>[PDF content - direct text extraction not supported. Use PDF to TXT conversion.]</p>'
    default:
      throw new Error(`Unsupported input format: ${ext}`)
  }
}

async function readInputAsText(inputPath: string): Promise<string> {
  const ext = path.extname(inputPath).slice(1).toLowerCase()
  const raw = fs.readFileSync(inputPath)

  switch (ext) {
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer: raw })
      return result.value
    }
    case 'html':
      return htmlToText(raw.toString('utf-8'))
    case 'md':
    case 'txt':
      return raw.toString('utf-8')
    case 'pdf': {
      const pdfDoc = await PDFDocument.load(raw)
      const pages = pdfDoc.getPages()
      const texts: string[] = []
      for (let i = 0; i < pages.length; i++) {
        texts.push(`--- Page ${i + 1} ---`)
      }
      return texts.join('\n') + '\n[Note: pdf-lib does not extract text. Content preserved in structure.]'
    }
    default:
      throw new Error(`Unsupported input format: ${ext}`)
  }
}

async function textToPdf(text: string, outputPath: string): Promise<void> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize = 11
  const margin = 50
  const lineHeight = fontSize * 1.4

  const lines = text.split('\n')
  let page = pdfDoc.addPage([595, 842]) // A4
  const { height } = page.getSize()
  let y = height - margin

  for (const line of lines) {
    const words = line.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const width = font.widthOfTextAtSize(testLine, fontSize)

      if (width > 595 - margin * 2 && currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0)
        })
        y -= lineHeight
        currentLine = word

        if (y < margin) {
          page = pdfDoc.addPage([595, 842])
          y = 842 - margin
        }
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      page.drawText(currentLine, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0)
      })
    }
    y -= lineHeight

    if (y < margin) {
      page = pdfDoc.addPage([595, 842])
      y = 842 - margin
    }
  }

  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync(outputPath, pdfBytes)
}

export async function convertDocument(options: DocConvertOptions): Promise<string> {
  const { inputPath, outputPath, outputFormat, onProgress } = options

  onProgress?.(10)

  const ext = path.extname(inputPath).slice(1).toLowerCase()

  if (ext === outputFormat) {
    fs.copyFileSync(inputPath, outputPath)
    onProgress?.(100)
    return outputPath
  }

  onProgress?.(30)

  switch (outputFormat) {
    case 'txt': {
      const text = await readInputAsText(inputPath)
      fs.writeFileSync(outputPath, text, 'utf-8')
      break
    }
    case 'html': {
      const html = await readInputAsHtml(inputPath)
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Converted Document</title>
<style>body{font-family:sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6;}</style>
</head>
<body>${html}</body></html>`
      fs.writeFileSync(outputPath, fullHtml, 'utf-8')
      break
    }
    case 'md': {
      const text = await readInputAsText(inputPath)
      fs.writeFileSync(outputPath, text, 'utf-8')
      break
    }
    case 'pdf': {
      const text = await readInputAsText(inputPath)
      await textToPdf(text, outputPath)
      break
    }
    default:
      throw new Error(`Unsupported output format: ${outputFormat}`)
  }

  onProgress?.(100)
  return outputPath
}

export async function getDocumentPreview(inputPath: string): Promise<string> {
  const text = await readInputAsText(inputPath)
  return text.slice(0, 2000)
}
