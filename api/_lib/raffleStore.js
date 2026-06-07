import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeRaffle } from "../../shared/raffle.js";
import { ensureSchema, getSql } from "./db.js";

export {
  normalizeRaffle,
  pickWinners,
  validateRaffleForDraw,
} from "../../shared/raffle.js";

const MP_RAFFLE_ID = "mp_raffle";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MP_RAFFLE_FILE = path.join(__dirname, "../../data/mp-raffle.json");

/** @returns {Promise<object | null>} */
async function readFile() {
  try {
    const raw = await fs.readFile(MP_RAFFLE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @param {object} payload */
async function writeFile(payload) {
  await fs.writeFile(MP_RAFFLE_FILE, JSON.stringify(payload, null, 2), "utf8");
}

/** @param {unknown} payload */
function normalizeStored(payload) {
  if (payload?.type === "mp_raffle") {
    const raffle = normalizeRaffle(payload);
    return { ...raffle, updatedAt: payload.updatedAt ?? null };
  }
  return { spots: 1, pool: [], winners: null, drawnAt: null, published: false, updatedAt: null };
}

/** @returns {Promise<import('../../shared/raffle.js').Raffle>} */
export async function getRaffleDraft() {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = await sql`
      SELECT payload FROM published_rosters WHERE id = ${MP_RAFFLE_ID}
    `;
    if (rows[0]?.payload) {
      const parsed =
        typeof rows[0].payload === "string" ? JSON.parse(rows[0].payload) : rows[0].payload;
      return normalizeStored(parsed);
    }
  }

  if (!process.env.VERCEL) {
    const filePayload = await readFile();
    if (filePayload) return normalizeStored(filePayload);
  }

  return { spots: 1, pool: [], winners: null, drawnAt: null, published: false, updatedAt: null };
}

/** @returns {Promise<{ published: boolean, raffle: import('../../shared/raffle.js').Raffle }>} */
export async function getPublishedRaffle() {
  const draft = await getRaffleDraft();
  if (!draft.published || !draft.winners?.length) {
    return { published: false, raffle: draft };
  }
  return { published: true, raffle: draft };
}

/**
 * @param {object} raffle partial raffle (spots, pool, winners, drawnAt)
 * @param {{ publish?: boolean }} [opts]
 */
export async function saveRaffle(raffle, opts = {}) {
  const normalized = normalizeRaffle({ ...raffle, published: Boolean(opts.publish) });
  const payload = {
    type: "mp_raffle",
    published: Boolean(opts.publish),
    updatedAt: new Date().toISOString(),
    spots: normalized.spots,
    pool: normalized.pool,
    winners: normalized.winners,
    drawnAt: raffle.drawnAt ?? normalized.drawnAt ?? null,
  };

  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    await sql`
      INSERT INTO published_rosters (id, payload, updated_at)
      VALUES (${MP_RAFFLE_ID}, ${JSON.stringify(payload)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at
    `;
    return payload;
  }

  if (!process.env.VERCEL) {
    await writeFile(payload);
    return payload;
  }

  const err = new Error(
    "No storage configured. Set DATABASE_URL to save the MP raffle in production."
  );
  err.code = "NO_STORAGE";
  throw err;
}
