import { tournament } from "../../shared/tournament.js";

const IGN_RE = /^[\w\s\-'.#]{2,24}$/u;
const UID_RE = /^\d{5,15}$/;
const DISCORD_RE = /^.{2,64}$/;
const X_HANDLE_RE = /^@?[A-Za-z0-9_]{1,15}$/;

/**
 * @param {unknown} body
 * @returns {{ ok: true, data: object } | { ok: false, error: string }}
 */
export function validateRegistration(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const ign = trim(body.ign);
  const uid = trim(body.uid);
  const xHandle = normalizeXHandle(trim(body.xHandle));
  const discord = trim(body.discord);
  const modes = body.modes;

  if (!ign || !IGN_RE.test(ign)) {
    return { ok: false, error: "Valid CODM in-game name is required" };
  }
  if (!uid || !UID_RE.test(uid)) {
    return { ok: false, error: "UID must be 5–15 digits" };
  }
  if (!xHandle || !X_HANDLE_RE.test(xHandle)) {
    return { ok: false, error: "Valid X handle is required (e.g. @username)" };
  }
  if (!discord || !DISCORD_RE.test(discord)) {
    return { ok: false, error: "Discord username is required" };
  }
  if (!Array.isArray(modes) || modes.length === 0) {
    return { ok: false, error: "Select at least one mode" };
  }

  const allowed = new Set(tournament.modes);
  const normalizedModes = [];
  for (const mode of modes) {
    const value = trim(mode);
    if (!allowed.has(value)) {
      return { ok: false, error: "Invalid mode selection" };
    }
    if (!normalizedModes.includes(value)) {
      normalizedModes.push(value);
    }
  }

  return {
    ok: true,
    data: {
      ign,
      uid,
      xHandle,
      discord,
      modes: normalizedModes,
    },
  };
}

/** @param {string} value */
function normalizeXHandle(value) {
  if (!value) return "";
  return value.startsWith("@") ? value : `@${value}`;
}

/** @param {unknown} value */
function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}
