import pool from '../config/database.js'

const PAGE = 25
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const IP_RE = /^[0-9a-fA-F:.]{3,45}$/

const ok = (res, data = {}) => res.json({ success: true, ...data })
const fail = (res, status, message) => res.status(status).json({ success: false, message })
const toId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null)

// Every change an admin makes is recorded.
async function audit(req, action, target, detail) {
  await pool
    .query(
      'INSERT INTO admin_actions (admin_id, action, target, detail) VALUES ($1, $2, $3, $4)',
      [req.account.userId, action, String(target).slice(0, 255), detail ? String(detail).slice(0, 1000) : null]
    )
    .catch(() => {})
}

export const wrap = (handler) => async (req, res) => {
  try {
    await handler(req, res)
  } catch (err) {
    console.error('admin error:', err)
    fail(res, 500, 'Admin request failed.')
  }
}

function paging(req) {
  const page = Math.max(0, Number(req.query.page) || 0)
  return { limit: PAGE + 1, offset: page * PAGE }
}

function sliceRows(rows) {
  return { rows: rows.slice(0, PAGE), hasMore: rows.length > PAGE }
}

export const getStats = wrap(async (req, res) => {
  const [users, jobs, tools, countries] = await Promise.all([
    pool.query(`
      SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE plan = 'premium' AND (plan_expires_at IS NULL OR plan_expires_at > NOW()))::int AS premium,
        COUNT(*) FILTER (WHERE status = 'disabled')::int AS disabled,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS new_week
      FROM users`),
    pool.query(`
      SELECT COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS jobs_24h,
        COUNT(*) FILTER (WHERE guest_id IS NOT NULL AND created_at > NOW() - INTERVAL '24 hours')::int AS guest_jobs_24h,
        COUNT(DISTINCT guest_id) FILTER (WHERE guest_id IS NOT NULL AND created_at > NOW() - INTERVAL '24 hours')::int AS guests_24h
      FROM jobs`),
    pool.query(`
      SELECT tool, COUNT(*)::int AS count FROM jobs
      WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY tool ORDER BY count DESC`),
    pool.query(`
      SELECT COALESCE(country, 'Unknown') AS country, COUNT(*)::int AS count FROM jobs
      WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY 1 ORDER BY count DESC LIMIT 8`),
  ])
  ok(res, { users: users.rows[0], jobs: jobs.rows[0], tools: tools.rows, countries: countries.rows })
})

export const listUsers = wrap(async (req, res) => {
  const search = req.query.search ? `%${String(req.query.search).slice(0, 100)}%` : null
  const plan = ['free', 'premium'].includes(req.query.plan) ? req.query.plan : null
  const { limit, offset } = paging(req)

  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.plan, u.plan_expires_at, u.status, u.role, u.created_at,
       (SELECT COUNT(*)::int FROM jobs j WHERE j.user_id = u.id AND j.guest_id IS NULL AND j.counted
          AND j.created_at > NOW() - INTERVAL '24 hours') AS used_today,
       (SELECT COUNT(*)::int FROM jobs j WHERE j.user_id = u.id) AS jobs_30d,
       (SELECT MAX(j.created_at) FROM jobs j WHERE j.user_id = u.id) AS last_active,
       (SELECT j.country FROM jobs j WHERE j.user_id = u.id AND j.guest_id IS NULL
          ORDER BY j.created_at DESC LIMIT 1) AS country,
       (SELECT j.city FROM jobs j WHERE j.user_id = u.id AND j.guest_id IS NULL
          ORDER BY j.created_at DESC LIMIT 1) AS city
     FROM users u
     WHERE ($1::text IS NULL OR u.email ILIKE $1 OR u.display_name ILIKE $1)
       AND ($2::text IS NULL OR u.plan = $2)
     ORDER BY u.created_at DESC
     LIMIT $3 OFFSET $4`,
    [search, plan, limit, offset]
  )
  ok(res, sliceRows(rows))
})

export const listGuests = wrap(async (req, res) => {
  const { limit, offset } = paging(req)

  const { rows } = await pool.query(
    `SELECT guest_id,
       COUNT(*)::int AS jobs,
       COUNT(*) FILTER (WHERE counted AND created_at > NOW() - INTERVAL '24 hours')::int AS used_today,
       MAX(created_at) AS last_seen,
       (ARRAY_AGG(ip ORDER BY created_at DESC))[1] AS ip,
       (ARRAY_AGG(country ORDER BY created_at DESC))[1] AS country,
       (ARRAY_AGG(city ORDER BY created_at DESC))[1] AS city,
       BOOL_OR(user_id IS NOT NULL) AS signed_up,
       EXISTS (SELECT 1 FROM blocks b WHERE b.kind = 'guest' AND b.value = jobs.guest_id) AS blocked
     FROM jobs
     WHERE guest_id IS NOT NULL
     GROUP BY guest_id
     ORDER BY MAX(created_at) DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  ok(res, sliceRows(rows))
})

export const listActivity = wrap(async (req, res) => {
  const userId = toId(req.query.userId)
  const guestId = UUID_RE.test(req.query.guestId || '') ? req.query.guestId : null
  const ip = IP_RE.test(req.query.ip || '') ? req.query.ip : null
  const { limit, offset } = paging(req)

  const { rows } = await pool.query(
    `SELECT j.id, j.tool, j.original_name, j.input_bytes, j.output_bytes, j.status, j.counted,
            j.created_at, j.ip, j.country, j.city, j.guest_id, j.user_id, u.email
     FROM jobs j LEFT JOIN users u ON u.id = j.user_id
     WHERE ($1::bigint IS NULL OR j.user_id = $1)
       AND ($2::text IS NULL OR j.guest_id = $2)
       AND ($3::text IS NULL OR j.ip = $3)
     ORDER BY j.created_at DESC
     LIMIT $4 OFFSET $5`,
    [userId, guestId, ip, limit, offset]
  )
  ok(res, sliceRows(rows))
})

export const listBlocks = wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM blocks ORDER BY created_at DESC LIMIT 200')
  ok(res, { rows })
})

export const resetUserUsage = wrap(async (req, res) => {
  const id = toId(req.params.id)
  if (!id) return fail(res, 400, 'Invalid user.')

  const result = await pool.query(
    `UPDATE jobs SET counted = false
     WHERE user_id = $1 AND guest_id IS NULL AND counted AND created_at > NOW() - INTERVAL '24 hours'`,
    [id]
  )
  await audit(req, 'reset_user_usage', `user:${id}`, `${result.rowCount} conversions`)
  ok(res, { reset: result.rowCount })
})

export const setUserPlan = wrap(async (req, res) => {
  const id = toId(req.params.id)
  const plan = req.body?.plan
  const days = toId(req.body?.days)
  if (!id || !['free', 'premium'].includes(plan)) return fail(res, 400, 'Invalid request.')

  await pool.query(
    `UPDATE users
     SET plan = $2::text,
         plan_expires_at = CASE WHEN $2::text = 'premium' AND $3::int IS NOT NULL
                                THEN NOW() + $3::int * INTERVAL '1 day' ELSE NULL END
     WHERE id = $1`,
    [id, plan, days]
  )
  await audit(req, 'set_plan', `user:${id}`, `${plan}${days ? ` for ${days} days` : ''}`)
  ok(res)
})

export const setUserStatus = wrap(async (req, res) => {
  const id = toId(req.params.id)
  const status = req.body?.status
  if (!id || !['active', 'disabled'].includes(status)) return fail(res, 400, 'Invalid request.')
  if (id === req.account.userId) return fail(res, 400, 'You cannot disable your own account.')

  await pool.query('UPDATE users SET status = $2 WHERE id = $1', [id, status])
  await audit(req, 'set_status', `user:${id}`, status)
  ok(res)
})

export const resetGuestUsage = wrap(async (req, res) => {
  const guestId = req.body?.guestId
  if (!UUID_RE.test(guestId || '')) return fail(res, 400, 'Invalid guest.')

  // Also clears the IP addresses this guest used, because the limit counts by IP too.
  const result = await pool.query(
    `UPDATE jobs SET counted = false
     WHERE guest_id IS NOT NULL AND counted AND created_at > NOW() - INTERVAL '24 hours'
       AND (guest_id = $1 OR ip IN (SELECT ip FROM jobs WHERE guest_id = $1 AND ip IS NOT NULL))`,
    [guestId]
  )
  await audit(req, 'reset_guest_usage', `guest:${guestId}`, `${result.rowCount} conversions`)
  ok(res, { reset: result.rowCount })
})

export const resetIpUsage = wrap(async (req, res) => {
  const ip = req.body?.ip
  if (!IP_RE.test(ip || '')) return fail(res, 400, 'Invalid IP address.')

  const result = await pool.query(
    `UPDATE jobs SET counted = false
     WHERE guest_id IS NOT NULL AND ip = $1 AND counted AND created_at > NOW() - INTERVAL '24 hours'`,
    [ip]
  )
  await audit(req, 'reset_ip_usage', `ip:${ip}`, `${result.rowCount} conversions`)
  ok(res, { reset: result.rowCount })
})

export const addBlock = wrap(async (req, res) => {
  const { kind, value } = req.body || {}
  const reason = String(req.body?.reason || '').slice(0, 255) || null

  const valid = kind === 'guest' ? UUID_RE.test(value || '') : kind === 'ip' ? IP_RE.test(value || '') : false
  if (!valid) return fail(res, 400, 'Invalid block.')

  await pool.query(
    'INSERT INTO blocks (kind, value, reason) VALUES ($1, $2, $3) ON CONFLICT (kind, value) DO NOTHING',
    [kind, value, reason]
  )
  await audit(req, 'block', `${kind}:${value}`, reason)
  ok(res)
})

export const removeBlock = wrap(async (req, res) => {
  const id = toId(req.params.id)
  if (!id) return fail(res, 400, 'Invalid block.')

  const { rows } = await pool.query('DELETE FROM blocks WHERE id = $1 RETURNING kind, value', [id])
  if (rows[0]) await audit(req, 'unblock', `${rows[0].kind}:${rows[0].value}`)
  ok(res)
})
