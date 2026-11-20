-- Run once on your FileForge database.

-- Plans for signed-in users: 'free' (default) or 'premium'.
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- Guests have no user row yet, so jobs can belong to a guest id instead.
ALTER TABLE jobs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS guest_id VARCHAR(64);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ip VARCHAR(64);

ALTER TABLE jobs ADD CONSTRAINT jobs_owner_check
  CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_jobs_guest ON jobs (guest_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_ip ON jobs (ip, created_at DESC);
