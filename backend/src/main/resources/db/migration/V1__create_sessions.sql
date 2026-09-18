CREATE TABLE sessions (
    session_id        UUID PRIMARY KEY,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at        TIMESTAMPTZ NOT NULL,
    situation_summary TEXT                     -- encrypted
);

CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);
