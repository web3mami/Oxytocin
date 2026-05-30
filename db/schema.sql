CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  ign TEXT NOT NULL,
  uid TEXT NOT NULL,
  x_handle TEXT,
  mode_mp BOOLEAN NOT NULL DEFAULT false,
  mode_br BOOLEAN NOT NULL DEFAULT false,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS players_ign_lower_idx ON players (LOWER(ign));
CREATE UNIQUE INDEX IF NOT EXISTS players_uid_idx ON players (uid);
