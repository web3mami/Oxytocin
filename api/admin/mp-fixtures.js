import { requireAdmin } from "../_lib/auth.js";
import { getMpFixturesDraft, saveMpFixtures } from "../_lib/mpFixturesStore.js";

export default async function handler(req, res) {
  const auth = requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === "GET") {
    try {
      const draft = await getMpFixturesDraft();
      return res.status(200).json({ ok: true, ...draft });
    } catch (err) {
      console.error("[admin/mp-fixtures GET]", err);
      return res.status(500).json({ error: "Failed to load MP fixtures" });
    }
  }

  if (req.method === "PUT") {
    const matches = req.body?.matches;
    if (!Array.isArray(matches)) {
      return res.status(400).json({ error: "matches array is required." });
    }
    try {
      const payload = await saveMpFixtures(matches, { publish: false });
      return res.status(200).json({ ok: true, ...payload });
    } catch (err) {
      if (err?.code === "NO_STORAGE") {
        return res.status(503).json({ error: err.message });
      }
      console.error("[admin/mp-fixtures PUT]", err);
      return res.status(500).json({ error: "Failed to save MP fixtures" });
    }
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
