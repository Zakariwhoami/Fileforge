import * as tokenModule from './verifyToken.js'
import pool from '../config/database.js'
import { normalizeIp } from '../utils/ip.js'

// Works with either `export default` or `export const verifyToken`.
const verifyToken = tokenModule.default || tokenModule.verifyToken

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Signed-in users send a Firebase token. Guests send a random id from their browser.
export function identify(req, res, next) {
  req.clientIp = normalizeIp(req.ip)

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
        'SELECT id, plan, plan_expires_at, role, status FROM users WHERE firebase_uid = $1',
        [req.user.uid]
      )
      const user = rows[0]

      if (user?.status === 'disabled') {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_DISABLED',
          message: 'This account has been disabled. Contact support.',
        })
      }
      req.account = { userId: user?.id ?? null, plan: effectivePlan(user), role: user?.role || 'user' }
    } else {
      // IP blocks only apply to guests, so one bad visitor cannot lock out real users on a shared network.
      const { rows } = await pool.query(
        `SELECT 1 FROM blocks
         WHERE (kind = 'guest' AND value = $1) OR (kind = 'ip' AND value = $2) LIMIT 1`,
        [req.guestId, req.clientIp]
      )
      if (rows[0]) {
        return res.status(403).json({
          success: false,
          code: 'BLOCKED',
          message: 'Access from this device has been restricted.',
        })
      }
      req.account = { userId: null, plan: 'guest', role: 'guest' }
    }
    next()
  } catch (err) {
    next(err)
  }
}

// The role is read from the database on every request, never from anything the browser sends.
export function requireAdmin(req, res, next) {
  if (req.account?.role === 'admin') return next()
  return res.status(403).json({ success: false, message: 'You do not have access to this page.' })
}
