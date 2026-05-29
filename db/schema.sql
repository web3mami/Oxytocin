CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  ign TEXT NOT NULL,
  uid TEXT NOT NULL,
  x_handle TEXT NOT NULL,
  discord TEXT NOT NULL,
  modes JSONB NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS players_uid_idx ON players (uid);
CREATE UNIQUE INDEX IF NOT EXISTS players_ign_lower_idx ON players (LOWER(ign));
