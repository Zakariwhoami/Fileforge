import multer from 'multer'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { TMP_DIR, MAX_FILE_BYTES } from '../config/storage.js'

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.docx', '.doc'])

export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TMP_DIR),
    // Never use the client's filename on disk.
    filename: (req, file, cb) => cb(null, `${randomUUID()}.upload`),
  }),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  // First check by extension. The real type is verified from the file's bytes later.
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_EXT.has(ext)) return cb(null, true)
    cb(new Error('Unsupported file type.'))
  },
})
