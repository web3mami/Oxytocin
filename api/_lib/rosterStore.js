import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { battleTeams } from "../../shared/teams.js";
import { ensureSchema, getSql } from "./db.js";

const ROSTER_ID = "br";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BR_ROSTER_FILE = path.join(__dirname, "../../data/br-roster.json");

/** @returns {Promise<object | null>} */
async function readBrRosterFile() {
  try {
    const raw = await fs.readFile(BR_ROSTER_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @param {object} payload */
async function writeBrRosterFile(payload) {
  await fs.writeFile(BR_ROSTER_FILE, JSON.stringify(payload, null, 2), "utf8");
}

/** @returns {Promise<{ published: boolean, squads: Array<object>, teams: Array<object> }>} */
export async function getPublishedRoster() {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = await sql`
      SELECT payload FROM published_rosters WHERE id = ${ROSTER_ID}
    `;
    if (rows[0]?.payload) {
      const parsed =
        typeof rows[0].payload === "string"
          ? JSON.parse(rows[0].payload)
          : rows[0].payload;
      return normalizePayload(parsed);
    }
  }

  if (!process.env.VERCEL) {
    const filePayload = await readBrRosterFile();
    if (filePayload) return normalizePayload(filePayload);
  }

  if (battleTeams.length) {
    return {
      published: true,
      squads: [],
      reserve: [],
      teams: battleTeams.map((team) => ({
        name: team.name,
        members: (team.members ?? []).map((m) => ({
          ign: m.ign,
          xHandle: m.xHandle ?? null,
          role: m.role ?? null,
        })),
      })),
    };
  }

  return { published: false, squads: [], teams: [], reserve: [] };
}

/** @param {object} payload */
export async function saveBrRoster(payload) {
  const normalized = {
    type: "br_duos",
    updatedAt: new Date().toISOString(),
    squads: payload.squads,
    reserve: payload.reserve ?? [],
    meta: payload.meta ?? null,
  };

  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    await sql`
      INSERT INTO published_rosters (id, payload, updated_at)
      VALUES (${ROSTER_ID}, ${JSON.stringify(normalized)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at
    `;
    return normalized;
  }

  if (!process.env.VERCEL) {
    await writeBrRosterFile(normalized);
    return normalized;
  }

  const err = new Error(
    "No storage configured. Set DATABASE_URL to publish rosters in production."
  );
  err.code = "NO_STORAGE";
  throw err;
}

/** @param {unknown} payload */
function normalizePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { published: false, squads: [], teams: [], reserve: [] };
  }

  const squads = Array.isArray(payload.squads) ? payload.squads : [];
  const reserve = Array.isArray(payload.reserve) ? payload.reserve : [];

  return {
    published: squads.length > 0,
    squads: squads.map((squad) => ({
      name: squad.name,
      lobbyNote: squad.lobbyNote ?? null,
      teams: (squad.teams ?? []).map((team) => ({
        name: team.name,
        members: (team.members ?? []).map((m) => ({
          ign: m.ign,
          xHandle: m.xHandle ?? null,
          role: m.role ?? null,
        })),
      })),
    })),
    reserve: reserve.map((m) => ({
      ign: m.ign,
      xHandle: m.xHandle ?? null,
      role: m.role ?? null,
    })),
    teams: [],
  };
}
