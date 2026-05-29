const TEAM_NAME_RE = /^[\w\s\-'.]{2,32}$/u;
const IGN_RE = /^[\w\s\-'.#]{2,24}$/u;
const UID_RE = /^\d{5,15}$/;
const DISCORD_RE = /^.{2,64}$/;

/**
 * @param {unknown} body
 * @returns {{ ok: true, data: object } | { ok: false, error: string }}
 */
export function validateRegistration(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const teamName = trim(body.teamName);
  const captainName = trim(body.captainName);
  const captainDiscord = trim(body.captainDiscord);
  const captainContact = trim(body.captainContact) || null;
  const players = body.players;

  if (!teamName || !TEAM_NAME_RE.test(teamName)) {
    return { ok: false, error: "Team name must be 2–32 characters" };
  }
  if (!captainName || captainName.length < 2 || captainName.length > 48) {
    return { ok: false, error: "Captain name is required" };
  }
  if (!captainDiscord || !DISCORD_RE.test(captainDiscord)) {
    return { ok: false, error: "Captain Discord is required" };
  }
  if (captainContact && captainContact.length > 80) {
    return { ok: false, error: "Contact info is too long" };
  }
  if (!Array.isArray(players) || players.length !== 5) {
    return { ok: false, error: "Exactly 5 players are required" };
  }

  const normalizedPlayers = [];
  const uids = new Set();

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const ign = trim(p?.ign);
    const uid = trim(p?.uid);
    const role = i === 0 ? "Captain" : trim(p?.role) || `Player ${i + 1}`;

    if (!ign || !IGN_RE.test(ign)) {
      return { ok: false, error: `Player ${i + 1}: invalid in-game name` };
    }
    if (!uid || !UID_RE.test(uid)) {
      return { ok: false, error: `Player ${i + 1}: UID must be 5–15 digits` };
    }
    if (uids.has(uid)) {
      return { ok: false, error: "Duplicate player UID in roster" };
    }
    uids.add(uid);
    normalizedPlayers.push({ ign, uid, role });
  }

  return {
    ok: true,
    data: {
      teamName,
      captainName,
      captainDiscord,
      captainContact,
      players: normalizedPlayers,
    },
  };
}

/** @param {unknown} value */
function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}
