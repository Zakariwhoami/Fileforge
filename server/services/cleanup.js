import fs from 'node:fs/promises'
import path from 'node:path'
import pool from '../config/database.js'
import { TMP_DIR, OUT_DIR } from '../config/storage.js'

const INTERVAL_MS = 10 * 60 * 1000
const ORPHAN_AGE_MS = 2 * 60 * 60 * 1000

async function sweep() {
  try {
    // 1. Delete expired results and mark them in history.
    const { rows } = await pool.query(
      `SELECT id, stored_name FROM jobs
       WHERE stored_name IS NOT NULL AND expires_at < NOW()`
    )
    for (const row of rows) {
      await fs.unlink(path.join(OUT_DIR, path.basename(row.stored_name))).catch(() => {})
      await pool.query(
        `UPDATE jobs SET stored_name = NULL, status = 'expired' WHERE id = $1`,
        [row.id]
      )
    }

    // 2. Remove leftovers from crashes. Anything older than 2 hours is safe to delete.
    for (const dir of [TMP_DIR, OUT_DIR]) {
      for (const name of await fs.readdir(dir)) {
        const filePath = path.join(dir, name)
        const stat = await fs.stat(filePath).catch(() => null)
        if (stat?.isFile() && Date.now() - stat.mtimeMs > ORPHAN_AGE_MS) {
          await fs.unlink(filePath).catch(() => {})
        }
      }
    }
  } catch (err) {
    console.error('Cleanup error:', err.message)
  }
}

export function startCleanup() {
  sweep()
  setInterval(sweep, INTERVAL_MS).unref()
}
