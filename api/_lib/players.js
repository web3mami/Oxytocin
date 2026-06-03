import { ensureSchema, getSql } from "./db.js";
import {
  addPlayerToFile,
  deletePlayerFromFile,
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

/** @param {string | number} id */
export async function deletePlayer(id) {
  if (id === undefined || id === null || String(id).trim() === "") {
    const err = new Error("Player id is required");
    err.code = "INVALID";
    throw err;
  }

  const idStr = String(id).trim();
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const numId = Number(idStr);
    if (!Number.isInteger(numId) || numId < 1) {
      const err = new Error("Registration not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    const rows = await sql`
      DELETE FROM players WHERE id = ${numId} RETURNING id
    `;
    if (!rows.length) {
      const err = new Error("Registration not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    return { id: rows[0].id };
  }
  if (isFileStoreAvailable()) {
    return deletePlayerFromFile(idStr);
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
