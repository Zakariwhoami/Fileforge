import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { TMP_DIR, MAX_FILE_BYTES } from '../config/storage.js'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TMP_DIR),
    // Never use the client's filename on disk.
    filename: (req, file, cb) => cb(null, `${randomUUID()}.upload`),
  }),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true)
    cb(new Error('Unsupported file type. Upload a JPG, PNG or WebP image.'))
  },
})
