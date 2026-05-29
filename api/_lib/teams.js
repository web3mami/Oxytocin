import { ensureSchema, getSql } from "./db.js";
import { addTeamToFile, isFileStoreAvailable, listTeamsFromFile } from "./fileStore.js";

/** @returns {Promise<Array<object>>} */
export async function listTeams() {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = await sql`
      SELECT id, team_name, captain_name, captain_discord, captain_contact,
             players, registered_at
      FROM teams
      ORDER BY registered_at DESC
    `;
    return rows.map(mapDbRow);
  }
  if (isFileStoreAvailable()) {
    return listTeamsFromFile();
  }
  return [];
}

/** @param {object} data */
export async function registerTeam(data) {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    try {
      const rows = await sql`
        INSERT INTO teams (team_name, captain_name, captain_discord, captain_contact, players)
        VALUES (
          ${data.teamName},
          ${data.captainName},
          ${data.captainDiscord},
          ${data.captainContact},
          ${JSON.stringify(data.players)}
        )
        RETURNING id, team_name, captain_name, captain_discord, captain_contact,
                  players, registered_at
      `;
      return mapDbRow(rows[0]);
    } catch (err) {
      if (err?.code === "23505") {
        const e = new Error("Team name already registered");
        e.code = "DUPLICATE";
        throw e;
      }
      throw err;
    }
  }
  if (isFileStoreAvailable()) {
    return addTeamToFile(data);
  }
  const err = new Error(
    "No storage configured. Set DATABASE_URL or run locally with vercel dev."
  );
  err.code = "NO_STORAGE";
  throw err;
}

/** @param {object} row */
function mapDbRow(row) {
  return {
    id: row.id,
    teamName: row.team_name,
    captainName: row.captain_name,
    captainDiscord: row.captain_discord,
    captainContact: row.captain_contact,
    players: typeof row.players === "string" ? JSON.parse(row.players) : row.players,
    registeredAt: row.registered_at,
  };
}
