import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureSchema, getSql } from "./db.js";

const MP_FIXTURES_ID = "mp_fixtures";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MP_FIXTURES_FILE = path.join(__dirname, "../../data/mp-fixtures.json");

/** @returns {Promise<object | null>} */
async function readMpFixturesFile() {
  try {
    const raw = await fs.readFile(MP_FIXTURES_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @param {object} payload */
async function writeMpFixturesFile(payload) {
  await fs.writeFile(MP_FIXTURES_FILE, JSON.stringify(payload, null, 2), "utf8");
}

/** @param {unknown} raw */
function normalizeMatches(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((match, index) => {
    const bye = Boolean(match?.bye);
    return {
      id: String(match?.id ?? `match-${index + 1}`),
      label: match?.label ? String(match.label).trim() : "",
      home: String(match?.home ?? "").trim(),
      away: bye ? "" : String(match?.away ?? "").trim(),
      bye,
    };
  });
}

/** @param {unknown} payload */
function normalizePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { published: false, matches: [], updatedAt: null };
  }
  return {
    published: Boolean(payload.published),
    matches: normalizeMatches(payload.matches),
    updatedAt: payload.updatedAt ?? null,
  };
}

/** @returns {Promise<{ published: boolean, matches: Array<object>, updatedAt: string | null }>} */
export async function getMpFixturesDraft() {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = await sql`
      SELECT payload FROM published_rosters WHERE id = ${MP_FIXTURES_ID}
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
    const filePayload = await readMpFixturesFile();
    if (filePayload) return normalizePayload(filePayload);
  }

  return { published: false, matches: [], updatedAt: null };
}

/** @returns {Promise<{ published: boolean, matches: Array<object> }>} */
export async function getPublishedMpFixtures() {
  const draft = await getMpFixturesDraft();
  if (!draft.published) {
    return { published: false, matches: [] };
  }
  return { published: true, matches: draft.matches };
}

/** @param {Array<object>} matches @param {{ publish?: boolean }} [opts] */
export async function saveMpFixtures(matches, opts = {}) {
  const normalized = {
    type: "mp_fixtures",
    published: Boolean(opts.publish),
    updatedAt: new Date().toISOString(),
    matches: normalizeMatches(matches),
  };

  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    await sql`
      INSERT INTO published_rosters (id, payload, updated_at)
      VALUES (${MP_FIXTURES_ID}, ${JSON.stringify(normalized)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at
    `;
    return normalized;
  }

  if (!process.env.VERCEL) {
    await writeMpFixturesFile(normalized);
    return normalized;
  }

  const err = new Error(
    "No storage configured. Set DATABASE_URL to save MP fixtures in production."
  );
  err.code = "NO_STORAGE";
  throw err;
}

/** @param {Array<object>} matches @param {Array<{ name: string }>} teams */
export function validateMpFixturesForPublish(matches, teams) {
  if (!Array.isArray(matches) || !matches.length) {
    return { ok: false, error: "Add at least one matchup before publishing." };
  }

  const teamNames = new Set(
    (teams ?? []).map((t) => String(t?.name ?? "").trim()).filter(Boolean)
  );
  if (!teamNames.size) {
    return {
      ok: false,
      error: "Build and save MP teams before publishing matchups.",
    };
  }

  const seenPairs = new Set();
  for (const match of matches) {
    const bye = Boolean(match?.bye);
    const home = String(match?.home ?? "").trim();
    const away = String(match?.away ?? "").trim();

    if (bye) {
      if (!home) {
        return { ok: false, error: "Pick which team has the bye." };
      }
      if (!teamNames.has(home)) {
        return {
          ok: false,
          error: `"${home}" is not on the roster.`,
        };
      }
      continue;
    }

    if (!home || !away) {
      return { ok: false, error: "Every matchup needs both teams selected (or mark a bye)." };
    }
    if (home === away) {
      return { ok: false, error: "A team cannot play itself." };
    }
    if (!teamNames.has(home) || !teamNames.has(away)) {
      return {
        ok: false,
        error: `"${home}" vs "${away}" uses a team that is not on the roster.`,
      };
    }
    const key = [home, away].sort().join("|");
    if (seenPairs.has(key)) {
      return { ok: false, error: `Duplicate matchup: ${home} vs ${away}.` };
    }
    seenPairs.add(key);
  }

  return { ok: true };
}
