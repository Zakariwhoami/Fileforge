import { Router } from 'express'
import { upload } from '../middleware/upload.js'
import {
  processFile,
  getHistory,
  downloadFile,
  deleteFile,
} from '../controllers/filesController.js'

const router = Router()

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next()
    const tooBig = err.code === 'LIMIT_FILE_SIZE'
    res.status(tooBig ? 413 : 400).json({
      success: false,
      message: tooBig ? 'That file is too large. The limit is 25 MB.' : err.message,
    })
  })
}

router.post('/process', handleUpload, processFile)
router.get('/history', getHistory)
router.get('/:id/download', downloadFile)
router.delete('/:id', deleteFile)

export default router
