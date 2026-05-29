CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  team_name TEXT NOT NULL,
  captain_name TEXT NOT NULL,
  captain_discord TEXT NOT NULL,
  captain_contact TEXT,
  players JSONB NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS teams_team_name_lower_idx
  ON teams (LOWER(team_name));
