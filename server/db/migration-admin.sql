-- Run once. Admin roles, account status, usage resets, location, blocks and an audit log.

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

-- counted = false means an admin reset this conversion, so it no longer uses up the daily limit.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS counted BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS country VARCHAR(2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS city VARCHAR(100);

CREATE TABLE IF NOT EXISTS blocks (
    id BIGSERIAL PRIMARY KEY,
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('guest', 'ip')),
    value VARCHAR(64) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (kind, value)
);

CREATE TABLE IF NOT EXISTS admin_actions (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target VARCHAR(255),
    detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Make yourself the admin (change the email, and log out and in again afterwards):
-- UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
