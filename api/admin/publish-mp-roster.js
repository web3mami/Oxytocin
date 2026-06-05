import { requireAdmin } from "../_lib/auth.js";
import {
  saveMpRoster,
  validateMpRosterForPublish,
} from "../_lib/mpRosterStore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const teams = req.body?.teams;
  if (!Array.isArray(teams)) {
    return res.status(400).json({ error: "teams array is required." });
  }

  const check = validateMpRosterForPublish(teams);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  try {
    const payload = await saveMpRoster(teams, { publish: true });
    return res.status(200).json({ ok: true, published: true, ...payload });
  } catch (err) {
    if (err?.code === "NO_STORAGE") {
      return res.status(503).json({ error: err.message });
    }
    console.error("[admin/publish-mp-roster]", err);
    return res.status(500).json({ error: "Failed to publish MP roster" });
  }
}
