import { auth } from '../firebase/config'

// Works whether VITE_API_URL is "http://localhost:5000" or "http://localhost:5000/api".
const ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')
const API_URL = `${ROOT}/api`

export const MAX_FILE_BYTES = 25 * 1024 * 1024

export function formatBytes(n) {
  if (n == null) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 ** 2).toFixed(1)} MB`
}

async function request(path, options = {}) {
  const user = auth.currentUser
  if (!user) throw new Error('Your session has ended. Log in again.')

  const token = await user.getIdToken()

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(
      data.message ||
        data.error ||
        `Request failed (${res.status}). Check the server terminal for details.`
    )
  }
  return res
}

export async function processFile({ file, tool, quality, target }) {
  const body = new FormData()
  body.append('tool', tool)
  if (target) body.append('target', target)
  if (quality) body.append('quality', String(quality))
  body.append('file', file) // append the file last so fields are parsed first

  const res = await request('/files/process', { method: 'POST', body })
  return (await res.json()).job
}

export async function getHistory() {
  const res = await request('/files/history')
  return (await res.json()).jobs
}

export async function deleteJob(id) {
  await request(`/files/${id}`, { method: 'DELETE' })
}

export async function downloadJob(job) {
  const res = await request(`/files/${job.id}/download`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = job.outputName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}