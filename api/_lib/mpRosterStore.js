import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROSTER_SIZE } from "../../shared/tournament.js";
import { ensureSchema, getSql } from "./db.js";

export { ROSTER_SIZE as MP_TEAM_SIZE };

const MP_ROSTER_ID = "mp";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MP_ROSTER_FILE = path.join(__dirname, "../../data/mp-roster.json");

/** @returns {Promise<object | null>} */
async function readMpRosterFile() {
  try {
    const raw = await fs.readFile(MP_ROSTER_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @param {object} payload */
async function writeMpRosterFile(payload) {
  await fs.writeFile(MP_ROSTER_FILE, JSON.stringify(payload, null, 2), "utf8");
}

/** @param {unknown} raw */
function normalizeTeams(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((team) => ({
    name: String(team?.name ?? "Team"),
    members: (Array.isArray(team?.members) ? team.members : []).map((m) => ({
      id: m?.id != null ? String(m.id) : null,
      ign: String(m?.ign ?? ""),
      uid: String(m?.uid ?? ""),
      xHandle: m?.xHandle ?? null,
    })),
  }));
}

/** @param {unknown} payload */
function normalizePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { published: false, teams: [], updatedAt: null };
  }
  return {
    published: Boolean(payload.published),
    teams: normalizeTeams(payload.teams),
    updatedAt: payload.updatedAt ?? null,
  };
}

/** @returns {Promise<{ published: boolean, teams: Array<object>, updatedAt: string | null }>} */
export async function getMpRosterDraft() {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = await sql`
      SELECT payload FROM published_rosters WHERE id = ${MP_ROSTER_ID}
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
    const filePayload = await readMpRosterFile();
    if (filePayload) return normalizePayload(filePayload);
  }

  return { published: false, teams: [], updatedAt: null };
}

/** @returns {Promise<{ published: boolean, teams: Array<object> }>} */
export async function getPublishedMpRoster() {
  const draft = await getMpRosterDraft();
  if (!draft.published) {
    return { published: false, teams: [] };
  }
  return { published: true, teams: draft.teams };
}

/** @param {Array<object>} teams @param {{ publish?: boolean }} [opts] */
export async function saveMpRoster(teams, opts = {}) {
  const normalized = {
    type: "mp_teams",
    published: Boolean(opts.publish),
    updatedAt: new Date().toISOString(),
    teams: normalizeTeams(teams),
  };

  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    await sql`
      INSERT INTO published_rosters (id, payload, updated_at)
      VALUES (${MP_ROSTER_ID}, ${JSON.stringify(normalized)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at
    `;
    return normalized;
  }

  if (!process.env.VERCEL) {
    await writeMpRosterFile(normalized);
    return normalized;
  }

  const err = new Error(
    "No storage configured. Set DATABASE_URL to save MP rosters in production."
  );
  err.code = "NO_STORAGE";
  throw err;
}

/** @param {Array<object>} teams */
export function validateMpRosterForPublish(teams) {
  if (!Array.isArray(teams) || !teams.length) {
    return { ok: false, error: "Add at least one team before publishing." };
  }

  const seen = new Set();
  for (const team of teams) {
    const members = team.members ?? [];
    if (members.length !== ROSTER_SIZE) {
      return {
        ok: false,
        error: `${team.name} must have exactly ${ROSTER_SIZE} players.`,
      };
    }
    for (const m of members) {
      if (!m?.id) {
        return { ok: false, error: `${team.name} has an empty slot.` };
      }
      const id = String(m.id);
      if (seen.has(id)) {
        return { ok: false, error: `${m.ign} is assigned to more than one team.` };
      }
      seen.add(id);
    }
  }

  return { ok: true };
}
