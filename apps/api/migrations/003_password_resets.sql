CREATE TABLE IF NOT EXISTS password_reset_sessions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash               TEXT NOT NULL,
  code_expires_at         TIMESTAMPTZ NOT NULL,
  attempts                SMALLINT NOT NULL DEFAULT 0,
  verified_at             TIMESTAMPTZ,
  reset_token_hash        TEXT UNIQUE,
  reset_token_expires_at  TIMESTAMPTZ,
  used_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prs_user    ON password_reset_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prs_token   ON password_reset_sessions(reset_token_hash);
CREATE INDEX IF NOT EXISTS idx_prs_expires ON password_reset_sessions(code_expires_at);
