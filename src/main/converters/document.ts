import fs from 'fs'
import path from 'path'
import mammoth from 'mammoth'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { marked } from 'marked'
import { htmlToText } from 'html-to-text'
import { promisify } from 'util'
import { exec } from 'child_process'
import zlib from 'zlib'

const execAsync = promisify(exec)

export interface DocConvertOptions {
  inputPath: string
  outputPath: string
  outputFormat: string
  onProgress?: (percent: number) => void
}

// Mammoth handles docx-family formats
const MAMMOTH_EXTS = new Set(['docx', 'docm', 'dotx', 'dotm', 'dot'])

// Formats we can extract text from via XML parsing (they're ZIP-based XML)
const ODT_EXTS = new Set(['odt', 'sxw', 'ott'])

function stripRtf(rtf: string): string {
  return rtf
    .replace(/\\[a-z]+\d* ?/g, ' ')
    .replace(/\{|\}/g, '')
    .replace(/\\\*/g, '')
    .replace(/\\'/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function extractOdtText(inputPath: string): Promise<string> {
  // ODT/SXW are ZIP files containing content.xml
  const AdmZip = require('adm-zip')
  const zip = new AdmZip(inputPath)
  const contentEntry = zip.getEntry('content.xml')
  if (!contentEntry) throw new Error('Invalid ODT file: content.xml not found')
  const xml = contentEntry.getData().toString('utf-8')
  return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function extractXmlText(inputPath: string): Promise<string> {
  const raw = fs.readFileSync(inputPath, 'utf-8')
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function readInputAsText(inputPath: string): Promise<string> {
  const ext = path.extname(inputPath).slice(1).toLowerCase()
  const raw = fs.readFileSync(inputPath)

  if (MAMMOTH_EXTS.has(ext)) {
    const result = await mammoth.extractRawText({ buffer: raw })
    return result.value
  }

  if (ODT_EXTS.has(ext)) {
    return extractOdtText(inputPath)
  }

  switch (ext) {
    case 'doc': {
      // Try mammoth for legacy DOC (limited support)
      try {
        const result = await mammoth.extractRawText({ buffer: raw })
        return result.value
      } catch {
        return raw.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim()
      }
    }
    case 'rtf':
      return stripRtf(raw.toString('latin1'))
    case 'html':
      return htmlToText(raw.toString('utf-8'))
    case 'md':
    case 'txt':
      return raw.toString('utf-8')
    case 'xps':
    case 'dbk':
    case 'aw':
    case 'kwd':
      return extractXmlText(inputPath)
    case 'pdf': {
      const pdfDoc = await PDFDocument.load(raw)
      const pageCount = pdfDoc.getPageCount()
      return `[PDF Document - ${pageCount} page(s)]\n[Note: Full text extraction requires a PDF parsing library.]`
    }
    case 'djvu':
      throw new Error('DJVU text extraction requires DjVuLibre. Please install it and try again.')
    default:
      // Best-effort: try as text
      return raw.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim()
  }
}

async function readInputAsHtml(inputPath: string): Promise<string> {
  const ext = path.extname(inputPath).slice(1).toLowerCase()
  const raw = fs.readFileSync(inputPath)

  if (MAMMOTH_EXTS.has(ext)) {
    const result = await mammoth.convertToHtml({ buffer: raw })
    return result.value
  }

  switch (ext) {
    case 'html':
      return raw.toString('utf-8')
    case 'md':
      return await marked(raw.toString('utf-8'))
    case 'txt':
      return `<pre>${raw.toString('utf-8')}</pre>`
    default: {
      const text = await readInputAsText(inputPath)
      return `<pre>${text}</pre>`
    }
  }
}

async function textToPdf(text: string, outputPath: string): Promise<void> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize = 11
  const margin = 50
  const lineHeight = fontSize * 1.4

  const lines = text.split('\n')
  let page = pdfDoc.addPage([595, 842])
  const { height } = page.getSize()
  let y = height - margin

  for (const line of lines) {
    const words = line.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const width = font.widthOfTextAtSize(testLine, fontSize)

      if (width > 595 - margin * 2 && currentLine) {
        page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) })
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
      page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) })
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
    case 'rtf': {
      const text = await readInputAsText(inputPath)
      const rtfContent = `{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Helvetica;}}\n\\f0\\fs22 ${text.replace(/\n/g, '\\par\n').replace(/[\\{}]/g, '\\$&')}\n}`
      fs.writeFileSync(outputPath, rtfContent, 'latin1')
      break
    }
    default:
      throw new Error(`Unsupported output format: ${outputFormat}`)
  }

  onProgress?.(100)
  return outputPath
}

export async function getDocumentPreview(inputPath: string): Promise<string> {
  try {
    const text = await readInputAsText(inputPath)
    return text.slice(0, 2000)
  } catch {
    return '[Preview not available for this format]'
  }
}
