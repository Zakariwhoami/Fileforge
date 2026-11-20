import * as tokenModule from './verifyToken.js'
import pool from '../config/database.js'

// Works with either `export default` or `export const verifyToken`.
const verifyToken = tokenModule.default || tokenModule.verifyToken

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Signed-in users send a Firebase token. Guests send a random id from their browser.
export function identify(req, res, next) {
  if (req.headers.authorization) return verifyToken(req, res, next)

  const guestId = req.get('x-guest-id')
  if (guestId && UUID_RE.test(guestId)) {
    req.guestId = guestId
    return next()
  }
  return res.status(401).json({ success: false, message: 'Missing credentials.' })
}

function effectivePlan(user) {
  if (!user) return 'free'
  const active = !user.plan_expires_at || new Date(user.plan_expires_at) > new Date()
  return user.plan === 'premium' && active ? 'premium' : 'free'
}

export async function loadAccount(req, res, next) {
  try {
    if (req.user) {
      const { rows } = await pool.query(
        'SELECT id, plan, plan_expires_at FROM users WHERE firebase_uid = $1',
        [req.user.uid]
      )
      req.account = { userId: rows[0]?.id ?? null, plan: effectivePlan(rows[0]) }
    } else {
      req.account = { userId: null, plan: 'guest' }
    }
    next()
  } catch (err) {
    next(err)
  }
}
