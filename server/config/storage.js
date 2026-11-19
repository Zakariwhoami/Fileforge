import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'uploads'
)

export const TMP_DIR = path.join(root, 'tmp') // incoming uploads, deleted right after processing
export const OUT_DIR = path.join(root, 'out') // processed results, deleted when they expire
export const FILE_TTL_MINUTES = 60
export const MAX_FILE_BYTES = 25 * 1024 * 1024

fs.mkdirSync(TMP_DIR, { recursive: true })
fs.mkdirSync(OUT_DIR, { recursive: true })
