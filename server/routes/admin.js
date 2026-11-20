import { Router } from 'express'
import { identify, loadAccount, requireAdmin } from '../middleware/identify.js'
import {
  getStats,
  listUsers,
  listGuests,
  listActivity,
  listBlocks,
  resetUserUsage,
  setUserPlan,
  setUserStatus,
  resetGuestUsage,
  resetIpUsage,
  addBlock,
  removeBlock,
} from '../controllers/adminController.js'

const router = Router()

// Everything here needs a signed-in user whose role is "admin" in the database.
router.use(identify, loadAccount, requireAdmin)

router.get('/stats', getStats)
router.get('/users', listUsers)
router.get('/guests', listGuests)
router.get('/activity', listActivity)
router.get('/blocks', listBlocks)

router.post('/users/:id/reset-usage', resetUserUsage)
router.post('/users/:id/plan', setUserPlan)
router.post('/users/:id/status', setUserStatus)
router.post('/guests/reset', resetGuestUsage)
router.post('/ips/reset', resetIpUsage)
router.post('/blocks', addBlock)
router.delete('/blocks/:id', removeBlock)

export default router