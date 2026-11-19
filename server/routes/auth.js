
import express from 'express'
import pool from '../config/database.js'
import { verifyToken } from '../middleware/verifyToken.js'

const router = express.Router()

router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { uid, email, name } = req.user

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'A verified email is required'
      })
    }

    const result = await pool.query(
      `INSERT INTO users (firebase_uid, email, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid)
       DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         updated_at = NOW()
       RETURNING id, firebase_uid, email, display_name, created_at`,
      [uid, email, name || null]
    )

    res.json({
      success: true,
      message: 'Account synchronized successfully',
      user: result.rows[0]
    })

  } catch (error) {
    console.error('User synchronization error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to synchronize account'
    })
  }
})

export default router
