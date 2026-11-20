import { request } from './files'

async function get(path, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString()
  const res = await request(`/admin${path}${query ? `?${query}` : ''}`)
  return res.json()
}

async function send(method, path, body) {
  const res = await request(`/admin${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export const getStats = () => get('/stats')
export const getUsers = (params) => get('/users', params)
export const getGuests = (params) => get('/guests', params)
export const getActivity = (params) => get('/activity', params)
export const getBlocks = () => get('/blocks')

export const resetUserUsage = (id) => send('POST', `/users/${id}/reset-usage`)
export const setUserPlan = (id, plan, days) => send('POST', `/users/${id}/plan`, { plan, days })
export const setUserStatus = (id, status) => send('POST', `/users/${id}/status`, { status })
export const resetGuestUsage = (guestId) => send('POST', '/guests/reset', { guestId })
export const resetIpUsage = (ip) => send('POST', '/ips/reset', { ip })
export const addBlock = (kind, value, reason) => send('POST', '/blocks', { kind, value, reason })
export const removeBlock = (id) => send('DELETE', `/blocks/${id}`)