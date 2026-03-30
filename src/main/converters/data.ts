import fs from 'fs'
import path from 'path'
import { parse as csvParse } from 'csv-parse/sync'
import { stringify as csvStringify } from 'csv-stringify/sync'
import { Builder, parseStringPromise } from 'xml2js'
import yaml from 'js-yaml'

export interface DataConvertOptions {
  inputPath: string
  outputPath: string
  outputFormat: string
  onProgress?: (percent: number) => void
}

type DataRecord = Record<string, unknown>

async function readAsRecords(inputPath: string): Promise<DataRecord[]> {
  const ext = path.extname(inputPath).slice(1).toLowerCase()
  const raw = fs.readFileSync(inputPath, 'utf-8')

  switch (ext) {
    case 'csv': {
      const records = csvParse(raw, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }) as DataRecord[]
      return records
    }
    case 'json': {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : [parsed]
    }
    case 'xml': {
      const result = await parseStringPromise(raw, { explicitArray: false })
      const rootKey = Object.keys(result)[0]
      const inner = result[rootKey]
      if (inner && typeof inner === 'object') {
        const itemKey = Object.keys(inner).find((k) => Array.isArray(inner[k])) || Object.keys(inner)[0]
        const items = inner[itemKey]
        return Array.isArray(items) ? items : [items]
      }
      return [inner]
    }
    case 'yaml':
    case 'yml': {
      const parsed = yaml.load(raw)
      if (Array.isArray(parsed)) return parsed as DataRecord[]
      if (parsed && typeof parsed === 'object') return [parsed as DataRecord]
      return [{ value: parsed }]
    }
    default:
      throw new Error(`Unsupported data input format: ${ext}`)
  }
}

function writeRecords(records: DataRecord[], outputPath: string, outputFormat: string): void {
  switch (outputFormat) {
    case 'csv': {
      const output = csvStringify(records, { header: true })
      fs.writeFileSync(outputPath, output, 'utf-8')
      break
    }
    case 'json': {
      fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), 'utf-8')
      break
    }
    case 'xml': {
      const builder = new Builder({
        rootName: 'root',
        xmldec: { version: '1.0', encoding: 'UTF-8' }
      })
      const xml = builder.buildObject({ item: records })
      fs.writeFileSync(outputPath, xml, 'utf-8')
      break
    }
    case 'yaml':
    case 'yml': {
      const output = yaml.dump(records, { indent: 2, lineWidth: 120 })
      fs.writeFileSync(outputPath, output, 'utf-8')
      break
    }
    default:
      throw new Error(`Unsupported data output format: ${outputFormat}`)
  }
}

export async function convertData(options: DataConvertOptions): Promise<string> {
  const { inputPath, outputPath, outputFormat, onProgress } = options

  onProgress?.(20)

  const records = await readAsRecords(inputPath)

  onProgress?.(60)

  writeRecords(records, outputPath, outputFormat)

  onProgress?.(100)

  return outputPath
}

export async function getDataPreview(inputPath: string): Promise<string> {
  const records = await readAsRecords(inputPath)
  const preview = records.slice(0, 10)
  return JSON.stringify(preview, null, 2)
}
