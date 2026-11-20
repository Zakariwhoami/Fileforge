import { auth } from '../firebase/config'
import { API_ROOT } from '../config'

const API_URL = `${API_ROOT}/api`

const GUEST_KEY = 'ff_guest_id'
const PENDING_KEY = 'ff_pending_download'
let memoryGuestId = null

export function formatBytes(n) {
  if (n == null) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 ** 2).toFixed(1)} MB`
}

// crypto.randomUUID only exists on https or localhost, so use a fallback for plain http.
function newId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

// A random id that lets a visitor use the tools without an account.
export function getGuestId() {
  try {
    let id = localStorage.getItem(GUEST_KEY)
    if (!id) {
      id = newId()
      localStorage.setItem(GUEST_KEY, id)
    }
    return id
  } catch {
    memoryGuestId = memoryGuestId || newId()
    return memoryGuestId
  }
}

// Remember which file to download right after the visitor signs up or logs in.
export function setPendingDownload(id) {
  try {
    sessionStorage.setItem(PENDING_KEY, String(id))
  } catch {
    // ignore
  }
}

export function takePendingDownload() {
  try {
    const value = sessionStorage.getItem(PENDING_KEY)
    sessionStorage.removeItem(PENDING_KEY)
    return value ? Number(value) : null
  } catch {
    return null
  }
}

export async function request(path, options = {}) {
  // Wait until Firebase has restored the saved login, so a signed-in user is not sent as a guest.
  if (typeof auth.authStateReady === 'function') await auth.authStateReady()

  const headers = { ...options.headers }
  const user = auth.currentUser
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`
  else headers['X-Guest-Id'] = getGuestId()

  let res
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const err = new Error(
      data.message ||
        data.error ||
        `Request failed (${res.status}). Check the server terminal for details.`
    )
    err.code = data.code
    err.status = res.status
    throw err
  }
  return res
}

export async function processFile({ file, tool, quality, target, level }) {
  const body = new FormData()
  body.append('tool', tool)
  if (target) body.append('target', target)
  if (level) body.append('level', level)
  if (quality) body.append('quality', String(quality))
  body.append('file', file) // append the file last so fields are parsed first

  const res = await request('/files/process', { method: 'POST', body })
  return res.json() // { job, usage }
}

export async function getUsage() {
  const res = await request('/files/usage')
  return (await res.json()).usage
}

export async function getHistory() {
  const res = await request('/files/history')
  return (await res.json()).jobs
}

export async function deleteJob(id) {
  await request(`/files/${id}`, { method: 'DELETE' })
}

// Links files made as a guest to the account that just signed in. Never blocks login.
export async function claimGuestJobs() {
  try {
    await request('/files/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: getGuestId() }),
    })
  } catch {
    // not critical
  }
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