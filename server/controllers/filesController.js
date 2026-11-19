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

const safeUnlink = (p) => (p ? fs.unlink(p).catch(() => {}) : Promise.resolve())

async function getUserId(req) {
  const { rows } = await pool.query(
    'SELECT id FROM users WHERE firebase_uid = $1',
    [req.user.uid]
  )
  return rows[0]?.id
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

function fail(res, status, message) {
  return res.status(status).json({ success: false, message })
}

export async function processFile(req, res) {
  const inputPath = req.file?.path
  let outputPath

  try {
    if (!req.file) return fail(res, 400, 'No file uploaded.')

    const tool = req.body.tool
    const def = IMAGE_TOOLS[tool]
    if (!def) return fail(res, 400, 'Unknown tool.')

    const userId = await getUserId(req)
    if (!userId) return fail(res, 401, 'Your account is not set up yet. Log in again.')

    let inputFormat = null
    try {
      inputFormat = await detectFormat(inputPath)
    } catch {
      // not a readable image
    }
    if (!def.accepts.includes(inputFormat)) {
      return fail(res, 400, 'This tool does not accept that file. It may be damaged or the wrong type.')
    }

    const target = req.body.target
    if (tool === 'convert-image') {
      if (!TARGET_FORMATS.includes(target)) {
        return fail(res, 400, 'Choose a format to convert to.')
      }
      if (target === inputFormat) {
        return fail(res, 400, 'That image is already in this format. Choose a different one.')
      }
    }

    const { ext } = describeOutput(tool, inputFormat, target)
    const storedName = `${randomUUID()}.${ext}`
    outputPath = path.join(OUT_DIR, storedName)

    await runImageTool({
      tool,
      inputPath,
      outputPath,
      inputFormat,
      quality: req.body.quality,
      target,
    })

    const outputBytes = (await fs.stat(outputPath)).size
    const base =
      path.parse(req.file.originalname).name.replace(/[^\w.\- ]+/g, '_').slice(0, 100) || 'file'
    const outputName = tool === 'compress-image' ? `${base}-compressed.${ext}` : `${base}.${ext}`

    const { rows } = await pool.query(
      `INSERT INTO jobs
        (user_id, tool, original_name, output_name, stored_name, input_bytes, output_bytes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + ($8 || ' minutes')::interval)
       RETURNING *`,
      [
        userId,
        tool,
        req.file.originalname.slice(0, 255),
        outputName,
        storedName,
        req.file.size,
        outputBytes,
        String(FILE_TTL_MINUTES),
      ]
    )

    return res.status(201).json({ success: true, job: toJob(rows[0]) })
  } catch (err) {
    console.error('processFile error:', err)
    await safeUnlink(outputPath)
    return fail(res, 500, 'We could not process this file. Try again.')
  } finally {
    await safeUnlink(inputPath)
  }
}

export async function getHistory(req, res) {
  try {
    const userId = await getUserId(req)
    if (!userId) return res.json({ success: true, jobs: [] })

    const { rows } = await pool.query(
      'SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
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

    const userId = await getUserId(req)
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

    const userId = await getUserId(req)
    const { rows } = await pool.query(
      'DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING stored_name',
      [id, userId]
    )
    if (!rows[0]) return fail(res, 404, 'Not found.')

    if (rows[0].stored_name) {
      await safeUnlink(path.join(OUT_DIR, path.basename(rows[0].stored_name)))
    }
    return res.json({ success: true })
  } catch (err) {
    console.error('deleteFile error:', err)
    return fail(res, 500, 'Could not delete this file.')
  }
}
