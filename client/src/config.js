// Where the backend lives.
// With no VITE_API_URL set, it follows the address the page was opened from. The same app then
// works on the laptop (localhost) and on a phone (the laptop's network address, for example
// 192.168.1.20), because the backend is assumed to be on port 5000 of the same machine.
// In production, set VITE_API_URL to your real backend address before building.
const fromEnv = import.meta.env.VITE_API_URL

export const API_ROOT = (fromEnv || `${window.location.protocol}//${window.location.hostname}:5000`)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')
