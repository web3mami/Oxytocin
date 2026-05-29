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
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      ign TEXT NOT NULL,
      uid TEXT NOT NULL,
      x_handle TEXT NOT NULL,
      discord TEXT NOT NULL,
      modes JSONB NOT NULL,
      registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS players_uid_idx ON players (uid)
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS players_ign_lower_idx ON players (LOWER(ign))
  `;
  schemaReady = true;
}
