const IGN_RE = /^[\w\s\-'.#]{2,32}$/u;
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
  const xHandle = trim(body.xHandle).replace(/^@/, "");
  const modeMp = Boolean(body.modeMp);
  const modeBr = Boolean(body.modeBr);

  if (!ign || !IGN_RE.test(ign)) {
    return { ok: false, error: "Please enter your in-game name." };
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
