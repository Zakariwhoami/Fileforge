const MB = 1024 * 1024

// dailyLimit: conversions per rolling 24 hours (null = unlimited)
// maxBytes: largest file accepted on that plan
export const PLANS = {
  guest: { label: 'Guest', dailyLimit: 3, maxBytes: 10 * MB },
  free: { label: 'Free', dailyLimit: 10, maxBytes: 25 * MB },
  premium: { label: 'Premium', dailyLimit: null, maxBytes: 100 * MB },
}
