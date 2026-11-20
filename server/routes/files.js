import { Router } from 'express'
import { upload } from '../middleware/upload.js'
import { identify, loadAccount } from '../middleware/identify.js'
import {
  processFile,
  getUsageInfo,
  claimGuestJobs,
  getHistory,
  downloadFile,
  deleteFile,
} from '../controllers/filesController.js'

const router = Router()

// Every route accepts a signed-in user or a guest. Each handler decides what a guest may do.
router.use(identify, loadAccount)

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next()
    const tooBig = err.code === 'LIMIT_FILE_SIZE'
    res.status(tooBig ? 413 : 400).json({
      success: false,
      code: tooBig ? 'FILE_TOO_LARGE' : undefined,
      message: tooBig ? 'That file is too large.' : err.message,
    })
  })
}

router.get('/usage', getUsageInfo)
router.post('/process', handleUpload, processFile) // guests allowed
router.post('/claim', claimGuestJobs) // signed in only
router.get('/history', getHistory) // signed in only
router.get('/:id/download', downloadFile) // signed in only
router.delete('/:id', deleteFile) // signed in only

export default router
