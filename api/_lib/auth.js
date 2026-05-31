/**
 * @param {{ headers?: Record<string, string | string[] | undefined> }} req
 * @returns {{ ok: true } | { ok: false, status: number, error: string }}
 */
export function requireAdmin(req) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return { ok: false, status: 503, error: "Admin access is not configured." };
  }

  const header = req.headers?.authorization ?? req.headers?.Authorization ?? "";
  const value = Array.isArray(header) ? header[0] : header;
  const token = value.startsWith("Bearer ") ? value.slice(7) : "";

  if (!token || token !== password) {
    return { ok: false, status: 401, error: "Invalid admin password." };
  }

  return { ok: true };
}
