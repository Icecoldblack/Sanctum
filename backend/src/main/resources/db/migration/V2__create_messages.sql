CREATE TABLE messages (
    id           BIGSERIAL PRIMARY KEY,
    session_id   UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    conversation VARCHAR(16) NOT NULL,         -- 'therapy' | 'legal'
    role         VARCHAR(16) NOT NULL,         -- 'user' | 'assistant'
    content      TEXT NOT NULL,                -- encrypted
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session_conv ON messages (session_id, conversation, created_at);
