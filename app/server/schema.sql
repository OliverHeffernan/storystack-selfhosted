CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  email_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_metadata jsonb NOT NULL DEFAULT '{}',
  banned_until timestamptz,
  deleted_at timestamptz
);
CREATE UNIQUE INDEX users_email_key ON users (lower(email));

CREATE TABLE books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT '',
  start_date timestamptz,
  end_date timestamptz,
  user_id uuid NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  image_url text,
  status text NOT NULL DEFAULT 'want-to-read',
  pages numeric NOT NULL DEFAULT 0,
  colour text
);
CREATE INDEX books_user_id_idx ON books (user_id);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_expiry_idx ON sessions (expires_at);

CREATE TABLE email_confirmations (
  token_hash text PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
