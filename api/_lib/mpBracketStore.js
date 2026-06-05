import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateBracket,
  normalizeBracket,
  validateBracketForPublish,
} from "../../shared/mpBracket.js";
import { ensureSchema, getSql } from "./db.js";

export {
  bracketFromDraw,
  generateBracket,
  normalizeBracket,
  setMatchWinner,
  validateBracketForPublish,
} from "../../shared/mpBracket.js";

const MP_BRACKET_ID = "mp_bracket";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MP_BRACKET_FILE = path.join(__dirname, "../../data/mp-bracket.json");

/** @returns {Promise<object | null>} */
async function readFile() {
  try {
    const raw = await fs.readFile(MP_BRACKET_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @param {object} payload */
async function writeFile(payload) {
  await fs.writeFile(MP_BRACKET_FILE, JSON.stringify(payload, null, 2), "utf8");
}

/** @returns {Promise<import('../../shared/mpBracket.js').MpBracket & { published: boolean }>} */
export async function getMpBracketDraft() {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = await sql`
      SELECT payload FROM published_rosters WHERE id = ${MP_BRACKET_ID}
    `;
    if (rows[0]?.payload) {
      const parsed =
        typeof rows[0].payload === "string"
          ? JSON.parse(rows[0].payload)
          : rows[0].payload;
      return normalizeStored(parsed);
    }
  }

  if (!process.env.VERCEL) {
    const filePayload = await readFile();
    if (filePayload) return normalizeStored(filePayload);
  }

  return { bracketSize: 0, rounds: [], published: false, updatedAt: null };
}

/** @param {unknown} payload */
function normalizeStored(payload) {
  if (payload?.type === "mp_bracket" && payload.rounds) {
    const bracket = normalizeBracket(payload);
    return {
      ...bracket,
      published: Boolean(payload.published),
      updatedAt: payload.updatedAt ?? null,
    };
  }
  return { bracketSize: 0, rounds: [], published: false, updatedAt: null };
}

/** @returns {Promise<{ published: boolean, bracket: object }>} */
export async function getPublishedMpBracket() {
  const draft = await getMpBracketDraft();
  if (!draft.published || !draft.rounds?.length) {
    return { published: false, bracket: { bracketSize: 0, rounds: [] } };
  }
  return {
    published: true,
    bracket: {
      bracketSize: draft.bracketSize,
      leafCount: draft.leafCount ?? draft.rounds?.[0]?.matches?.length ?? 0,
      rounds: draft.rounds,
      byeAdvance: draft.byeAdvance ?? null,
    },
  };
}

/** @param {object} bracket @param {{ publish?: boolean }} [opts] */
export async function saveMpBracket(bracket, opts = {}) {
  const normalized = normalizeBracket({
    ...bracket,
    published: Boolean(opts.publish),
    updatedAt: new Date().toISOString(),
  });

  const payload = {
    type: "mp_bracket",
    published: Boolean(opts.publish),
    updatedAt: normalized.updatedAt,
    bracketSize: normalized.bracketSize,
    leafCount: normalized.leafCount ?? normalized.rounds?.[0]?.matches?.length ?? 0,
    rounds: normalized.rounds,
    byeAdvance: normalized.byeAdvance ?? bracket.byeAdvance ?? null,
  };

  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    await sql`
      INSERT INTO published_rosters (id, payload, updated_at)
      VALUES (${MP_BRACKET_ID}, ${JSON.stringify(payload)}::jsonb, NOW())
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
    "No storage configured. Set DATABASE_URL to save the MP bracket in production."
  );
  err.code = "NO_STORAGE";
  throw err;
}

/** @param {string[]} teamNames */
export async function generateAndSaveMpBracket(teamNames) {
  const bracket = generateBracket(teamNames);
  return saveMpBracket(bracket, { publish: false });
}

/** @param {Array<object>} fixtures @param {string[]} teamNames @param {{ publish?: boolean }} [opts] */
export async function saveBracketFromDraw(fixtures, teamNames, opts = {}) {
  const bracket = bracketFromDraw(fixtures, teamNames);
  return saveMpBracket(bracket, opts);
}
