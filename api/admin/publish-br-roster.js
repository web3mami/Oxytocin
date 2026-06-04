import { requireAdmin } from "../_lib/auth.js";
import { saveBrRoster } from "../_lib/rosterStore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const squads = req.body?.squads;
  if (!Array.isArray(squads) || !squads.length) {
    return res.status(400).json({ error: "Draft squads are required to publish." });
  }

  try {
    const payload = await saveBrRoster({
      squads,
      meta: req.body?.meta ?? null,
    });
    return res.status(200).json({ ok: true, published: true, ...payload });
  } catch (err) {
    if (err?.code === "NO_STORAGE") {
      return res.status(503).json({ error: err.message });
    }
    console.error("[admin/publish-br-roster]", err);
    return res.status(500).json({ error: "Failed to publish BR roster" });
  }
}
