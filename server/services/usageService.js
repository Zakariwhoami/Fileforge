import pool from '../config/database.js'
import { PLANS } from '../config/plans.js'

// Counts conversions in the last 24 hours.
// Signed-in users: their own jobs, excluding files made as a guest before signing up.
// Guests: by guest id OR IP address, so clearing the browser does not reset the limit.
export async function getUsage(req) {
  const { account, guestId } = req
  const plan = PLANS[account.plan]

  const { rows } = account.userId
    ? await pool.query(
        `SELECT COUNT(*)::int AS n FROM jobs
         WHERE user_id = $1 AND guest_id IS NULL
           AND created_at > NOW() - INTERVAL '24 hours'`,
        [account.userId]
      )
    : await pool.query(
        `SELECT COUNT(*)::int AS n FROM jobs
         WHERE guest_id IS NOT NULL AND (guest_id = $1 OR ip = $2)
           AND created_at > NOW() - INTERVAL '24 hours'`,
        [guestId || null, req.ip || null]
      )

  const used = rows[0].n
  return {
    plan: account.plan,
    planLabel: plan.label,
    used,
    limit: plan.dailyLimit,
    remaining: plan.dailyLimit == null ? null : Math.max(0, plan.dailyLimit - used),
    maxBytes: plan.maxBytes,
  }
}
