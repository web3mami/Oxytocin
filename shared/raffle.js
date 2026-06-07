/**
 * Reserve-spot raffle: losing players get a luck-based second chance.
 * Pure logic shared by the API (server draw) and the client (reveal/animation).
 */

/** @typedef {{ id: string | null, ign: string, uid: string, xHandle: string | null, team: string | null, dest: string | null }} RaffleEntry */
/** @typedef {{ spots: number, pool: RaffleEntry[], winners: RaffleEntry[] | null, drawnAt: string | null, published: boolean, updatedAt: string | null }} Raffle */

/** @param {unknown} raw @returns {RaffleEntry} */
export function normalizeEntry(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    id: r.id != null && r.id !== "" ? String(r.id) : null,
    ign: String(r.ign ?? ""),
    uid: String(r.uid ?? ""),
    xHandle: r.xHandle != null && r.xHandle !== "" ? String(r.xHandle) : null,
    team: r.team != null && r.team !== "" ? String(r.team) : null,
    // Where this player lands after the draw (destination team, or "Standby").
    dest: r.dest != null && r.dest !== "" ? String(r.dest) : null,
  };
}

/** @param {unknown} raw @returns {RaffleEntry[]} */
function normalizeEntries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeEntry).filter((e) => e.ign);
}

/** Stable identity for an entry (id when present, else ign). @param {RaffleEntry} e */
export function entryKey(e) {
  return e.id ?? `ign:${e.ign}`;
}

/** @param {unknown} raw @returns {Raffle} */
export function normalizeRaffle(raw) {
  if (!raw || typeof raw !== "object") {
    return { spots: 1, pool: [], winners: null, drawnAt: null, published: false, updatedAt: null };
  }
  const pool = normalizeEntries(raw.pool);
  const winners = Array.isArray(raw.winners) ? normalizeEntries(raw.winners) : null;
  const spotsRaw = Number(raw.spots);
  const spots = Number.isFinite(spotsRaw) && spotsRaw > 0 ? Math.floor(spotsRaw) : 1;
  return {
    spots: Math.min(spots, Math.max(1, pool.length || spots)),
    pool,
    winners: winners && winners.length ? winners : null,
    drawnAt: raw.drawnAt ?? null,
    published: Boolean(raw.published),
    updatedAt: raw.updatedAt ?? null,
  };
}

/**
 * Pick `spots` distinct winners from `pool` via partial Fisher–Yates.
 * @param {RaffleEntry[]} pool
 * @param {number} spots
 * @param {(maxExclusive: number) => number} [randomInt] integer in [0, maxExclusive); defaults to Math.random
 * @returns {RaffleEntry[]}
 */
export function pickWinners(pool, spots, randomInt = defaultRandomInt) {
  const entries = Array.isArray(pool) ? pool.slice() : [];
  const count = Math.max(0, Math.min(Math.floor(spots) || 0, entries.length));
  for (let i = 0; i < count; i += 1) {
    const j = i + randomInt(entries.length - i);
    const tmp = entries[i];
    entries[i] = entries[j];
    entries[j] = tmp;
  }
  return entries.slice(0, count);
}

/** @param {number} maxExclusive */
function defaultRandomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

/**
 * @param {Raffle} raffle
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateRaffleForDraw(raffle) {
  if (!raffle?.pool?.length) {
    return { ok: false, error: "Add at least one player to the raffle pool." };
  }
  if (!raffle.spots || raffle.spots < 1) {
    return { ok: false, error: "Set how many reserve spots to draw (at least 1)." };
  }
  if (raffle.spots > raffle.pool.length) {
    return { ok: false, error: "Cannot draw more winners than there are players in the pool." };
  }
  return { ok: true };
}
