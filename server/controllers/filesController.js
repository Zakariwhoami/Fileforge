import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import pool from '../config/database.js'
import { OUT_DIR, FILE_TTL_MINUTES } from '../config/storage.js'
import {
  IMAGE_TOOLS,
  TARGET_FORMATS,
  detectFormat,
  describeOutput,
  runImageTool,
} from '../services/imageService.js'
import {
  DOC_TOOLS,
  detectDocType,
  convertWordToPdf,
  compressPdf,
} from '../services/documentService.js'
import { getUsage } from '../services/usageService.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

class HttpError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

const safeUnlink = (p) => (p ? fs.unlink(p).catch(() => {}) : Promise.resolve())

function fail(res, status, message, code) {
  return res.status(status).json({ success: false, code, message })
}

// History, downloads and deletes are for signed-in users only.
function requireUser(req, res) {
  if (req.account.userId) return req.account.userId
  fail(res, 401, 'Sign up or log in to download your files.', 'LOGIN_REQUIRED')
  return null
}

function toJob(row) {
  return {
    id: Number(row.id),
    tool: row.tool,
    originalName: row.original_name,
    outputName: row.output_name,
    inputBytes: Number(row.input_bytes),
    outputBytes: row.output_bytes == null ? null : Number(row.output_bytes),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    downloadable: Boolean(row.stored_name) && new Date(row.expires_at) > new Date(),
  }
}

// A "plan" says what the output will be and how to produce it.
async function planImage(tool, req, inputPath) {
  const def = IMAGE_TOOLS[tool]

  let inputFormat = null
  try {
    inputFormat = await detectFormat(inputPath)
  } catch {
    // not a readable image
  }
  if (!def.accepts.includes(inputFormat)) {
    throw new HttpError(400, 'This tool does not accept that file. It may be damaged or the wrong type.')
  }

  const target = req.body.target
  if (tool === 'convert-image') {
    if (!TARGET_FORMATS.includes(target)) throw new HttpError(400, 'Choose a format to convert to.')
    if (target === inputFormat) {
      throw new HttpError(400, 'That image is already in this format. Choose a different one.')
    }
  }

  return {
    ext: describeOutput(tool, inputFormat, target).ext,
    suffix: tool === 'compress-image' ? '-compressed' : '',
    run: (outputPath) =>
      runImageTool({ tool, inputPath, outputPath, inputFormat, quality: req.body.quality, target }),
  }
}

async function planDocument(tool, req, inputPath) {
  const def = DOC_TOOLS[tool]

  const type = await detectDocType(inputPath).catch(() => null)
  if (!def.accepts.includes(type)) throw new HttpError(400, def.reject)

  return {
    ext: 'pdf',
    suffix: def.suffix,
    run: (outputPath) =>
      tool === 'word-to-pdf'
        ? convertWordToPdf({ inputPath, type, outputPath })
        : compressPdf({ inputPath, outputPath, level: req.body.level }),
  }
}

export async function processFile(req, res) {
  const inputPath = req.file?.path
  let outputPath

  try {
    if (!req.file) throw new HttpError(400, 'No file uploaded.')

    const { account } = req
    if (req.user && !account.userId) {
      throw new HttpError(401, 'Your account is not set up yet. Log in again.')
    }

    const usage = await getUsage(req)
    if (usage.remaining === 0) {
      throw new HttpError(
        429,
        account.userId
          ? `You have used all ${usage.limit} conversions for today. Upgrade to Premium for unlimited conversions.`
          : 'You have used your free conversions for today. Create a free account to get more.',
        'LIMIT_REACHED'
      )
    }
    if (req.file.size > usage.maxBytes) {
      throw new HttpError(
        413,
        `That file is larger than the ${Math.round(usage.maxBytes / 1024 / 1024)} MB limit for your plan.`,
        'FILE_TOO_LARGE'
      )
    }

    const tool = req.body.tool
    let plan
    if (IMAGE_TOOLS[tool]) plan = await planImage(tool, req, inputPath)
    else if (DOC_TOOLS[tool]) plan = await planDocument(tool, req, inputPath)
    else throw new HttpError(400, 'Unknown tool.')

    const storedName = `${randomUUID()}.${plan.ext}`
    outputPath = path.join(OUT_DIR, storedName)

    await plan.run(outputPath)

    const outputBytes = (await fs.stat(outputPath)).size
    const base =
      path.parse(req.file.originalname).name.replace(/[^\w.\- ]+/g, '_').slice(0, 100) || 'file'
    const outputName = `${base}${plan.suffix}.${plan.ext}`

    const { rows } = await pool.query(
      `INSERT INTO jobs
        (user_id, guest_id, ip, tool, original_name, output_name, stored_name, input_bytes, output_bytes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + ($10 || ' minutes')::interval)
       RETURNING *`,
      [
        account.userId || null,
        account.userId ? null : req.guestId,
        (req.ip || '').slice(0, 64) || null,
        tool,
        req.file.originalname.slice(0, 255),
        outputName,
        storedName,
        req.file.size,
        outputBytes,
        String(FILE_TTL_MINUTES),
      ]
    )

    return res.status(201).json({
      success: true,
      job: toJob(rows[0]),
      usage: await getUsage(req),
    })
  } catch (err) {
    await safeUnlink(outputPath)

    if (err instanceof HttpError) return fail(res, err.status, err.message, err.code)

    console.error('processFile error:', err)
    if (err.code === 'TOOL_MISSING') {
      console.error('Set SOFFICE_PATH or GS_PATH in server/.env to the full path of the program.')
      return fail(res, 503, 'This tool is not set up on the server yet.')
    }
    if (err.killed) {
      return fail(res, 504, 'This file took too long to process. Try a smaller file.')
    }
    return fail(res, 500, 'We could not process this file. It may be damaged or protected by a password.')
  } finally {
    await safeUnlink(inputPath)
  }
}

export async function getHistory(req, res) {
  try {
    const userId = requireUser(req, res)
    if (!userId) return

    const { rows } = await pool.query(
      `SELECT * FROM jobs WHERE user_id = $1 AND status <> 'deleted'
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    )
    return res.json({ success: true, jobs: rows.map(toJob) })
  } catch (err) {
    console.error('getHistory error:', err)
    return fail(res, 500, 'Could not load your history.')
  }
}

export async function downloadFile(req, res) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return fail(res, 400, 'Invalid file.')

    const userId = requireUser(req, res)
    if (!userId) return

    const { rows } = await pool.query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    const job = rows[0]

    if (!job || !toJob(job).downloadable) {
      return fail(res, 404, 'This file is no longer available. Files are kept for 1 hour.')
    }

    const filePath = path.join(OUT_DIR, path.basename(job.stored_name))
    res.download(filePath, job.output_name, (err) => {
      if (err && !res.headersSent) fail(res, 404, 'This file is no longer available.')
    })
  } catch (err) {
    console.error('downloadFile error:', err)
    return fail(res, 500, 'Download failed.')
  }
}

export async function deleteFile(req, res) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return fail(res, 400, 'Invalid file.')

    const userId = requireUser(req, res)
    if (!userId) return

    const { rows } = await pool.query(
      `SELECT stored_name FROM jobs WHERE id = $1 AND user_id = $2 AND status <> 'deleted'`,
      [id, userId]
    )
    if (!rows[0]) return fail(res, 404, 'Not found.')

    // Keep the row (so deleting history cannot reset the daily limit), remove the file.
    await pool.query(
      `UPDATE jobs SET status = 'deleted', stored_name = NULL WHERE id = $1`,
      [id]
    )
    if (rows[0].stored_name) {
      await safeUnlink(path.join(OUT_DIR, path.basename(rows[0].stored_name)))
    }
    return res.json({ success: true })
  } catch (err) {
    console.error('deleteFile error:', err)
    return fail(res, 500, 'Could not delete this file.')
  }
}

export async function getUsageInfo(req, res) {
  try {
    if (req.user && !req.account.userId) {
      return fail(res, 401, 'Your account is not set up yet. Log in again.')
    }
    return res.json({ success: true, usage: await getUsage(req) })
  } catch (err) {
    console.error('getUsageInfo error:', err)
    return fail(res, 500, 'Could not load usage.')
  }
}

// After signing up or logging in, attach the files made as a guest to the account.
export async function claimGuestJobs(req, res) {
  try {
    const userId = requireUser(req, res)
    if (!userId) return

    const guestId = req.body?.guestId
    if (typeof guestId !== 'string' || !UUID_RE.test(guestId)) {
      return res.json({ success: true, claimed: 0 })
    }

    const result = await pool.query(
      'UPDATE jobs SET user_id = $1 WHERE guest_id = $2 AND user_id IS NULL',
      [userId, guestId]
    )
    return res.json({ success: true, claimed: result.rowCount })
  } catch (err) {
    console.error('claimGuestJobs error:', err)
    return fail(res, 500, 'Could not link your files.')
  }
}
