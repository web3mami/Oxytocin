import { tournament } from "../../shared/tournament.js";
import { ensureSchema, getSql } from "./db.js";
import {
  addPlayerToFile,
  isFileStoreAvailable,
  listPlayersFromFile,
} from "./fileStore.js";

/** @returns {Promise<Array<object>>} */
export async function listPlayers() {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = await sql`
      SELECT id, ign, uid, x_handle, mode_mp, mode_br, registered_at
      FROM players
      ORDER BY registered_at DESC
    `;
    return rows.map(mapDbRow);
  }
  if (isFileStoreAvailable()) {
    return listPlayersFromFile();
  }
  return [];
}

/** @param {object} data */
export async function registerPlayer(data) {
  const existing = await listPlayers();
  if (existing.length >= tournament.maxPlayers) {
    const err = new Error("Registration is full");
    err.code = "FULL";
    throw err;
  }

  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    try {
      const rows = await sql`
        INSERT INTO players (ign, uid, x_handle, mode_mp, mode_br)
        VALUES (
          ${data.ign},
          ${data.uid},
          ${data.xHandle},
          ${data.modeMp},
          ${data.modeBr}
        )
        RETURNING id, ign, uid, x_handle, mode_mp, mode_br, registered_at
      `;
      return mapDbRow(rows[0]);
    } catch (err) {
      if (err?.code === "23505") {
        const e = new Error("This player is already registered");
        e.code = "DUPLICATE";
        throw e;
      }
      throw err;
    }
  }
  if (isFileStoreAvailable()) {
    return addPlayerToFile(data);
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
    ign: row.ign,
    uid: row.uid,
    xHandle: row.x_handle,
    modeMp: row.mode_mp,
    modeBr: row.mode_br,
    registeredAt: row.registered_at,
  };
}
