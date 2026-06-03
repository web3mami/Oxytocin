const IGN_MIN = 2;
const IGN_MAX = 32;
/** Disallow control characters only — CODM names may include symbols and Unicode. */
const IGN_INVALID_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
const UID_RE = /^\d{19,20}$/;
const X_HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

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
  const xHandle = trim(body.xHandle).replace(/^@/, "");
  const modeMp = Boolean(body.modeMp);
  const modeBr = Boolean(body.modeBr);

  if (!ign || ign.length < IGN_MIN || ign.length > IGN_MAX || IGN_INVALID_RE.test(ign)) {
    return { ok: false, error: "IGN must be 2–32 characters." };
  }
  if (!uid || !UID_RE.test(uid)) {
    return { ok: false, error: "UID must be 19–20 digits." };
  }
  if (xHandle && !X_HANDLE_RE.test(xHandle)) {
    return { ok: false, error: "Invalid X handle." };
  }
  if (!modeMp && !modeBr) {
    return { ok: false, error: "Pick at least one mode (MP, BR, or both)." };
  }

  return {
    ok: true,
    data: {
      ign,
      uid,
      xHandle: xHandle || null,
      modeMp,
      modeBr,
    },
  };
}

/** @param {unknown} value */
function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}
