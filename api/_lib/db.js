import { neon } from "@neondatabase/serverless";

/** @returns {import('@neondatabase/serverless').NeonQueryFunction | null} */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url || typeof url !== "string") return null;
  return neon(url.trim());
}

let schemaReady = false;

/** @param {import('@neondatabase/serverless').NeonQueryFunction} sql */
export async function ensureSchema(sql) {
  if (schemaReady) return;

  await sql`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      team_name TEXT NOT NULL,
      captain_name TEXT NOT NULL,
      captain_discord TEXT NOT NULL,
      captain_contact TEXT,
      players JSONB NOT NULL,
      registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS teams_team_name_lower_idx
      ON teams (LOWER(team_name))
  `;
  schemaReady = true;
}
