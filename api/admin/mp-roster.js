import { requireAdmin } from "../_lib/auth.js";
import { getMpRosterDraft, saveMpRoster } from "../_lib/mpRosterStore.js";

export default async function handler(req, res) {
  const auth = requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === "GET") {
    try {
      const draft = await getMpRosterDraft();
      return res.status(200).json({ ok: true, ...draft });
    } catch (err) {
      console.error("[admin/mp-roster GET]", err);
      return res.status(500).json({ error: "Failed to load MP roster" });
    }
  }

  if (req.method === "PUT") {
    const teams = req.body?.teams;
    if (!Array.isArray(teams)) {
      return res.status(400).json({ error: "teams array is required." });
    }

    try {
      const payload = await saveMpRoster(teams, { publish: false });
      return res.status(200).json({ ok: true, ...payload });
    } catch (err) {
      if (err?.code === "NO_STORAGE") {
        return res.status(503).json({ error: err.message });
      }
      console.error("[admin/mp-roster PUT]", err);
      return res.status(500).json({ error: "Failed to save MP roster" });
    }
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
