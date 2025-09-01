SET search_path = auth, public;

-- Helpful indexes for auth flows
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_username_idx ON users (username);
CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets (user_id);
CREATE INDEX IF NOT EXISTS password_resets_token_idx ON password_resets (token);
CREATE INDEX IF NOT EXISTS password_resets_expires_idx ON password_resets (expires_at);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON refresh_tokens (token);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_idx ON refresh_tokens (expires_at);
