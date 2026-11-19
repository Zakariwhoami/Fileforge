CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool VARCHAR(50) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    output_name VARCHAR(255),
    stored_name VARCHAR(100),
    input_bytes BIGINT NOT NULL,
    output_bytes BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'done',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_created ON jobs (user_id, created_at DESC);
