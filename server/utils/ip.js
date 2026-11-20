import geoip from 'geoip-lite'

// "::ffff:1.2.3.4" is how Node writes an IPv4 address on some systems.
export function normalizeIp(raw) {
  if (!raw) return null
  return raw.startsWith('::ffff:') ? raw.slice(7) : raw
}

// Offline lookup, no data leaves the server. City is often inaccurate, country is usually right.
export function lookupGeo(ip) {
  try {
    const geo = ip ? geoip.lookup(ip) : null
    return { country: geo?.country || null, city: (geo?.city || '').slice(0, 100) || null }
  } catch {
    return { country: null, city: null }
  }
}
