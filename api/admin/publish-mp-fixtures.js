import { requireAdmin } from "../_lib/auth.js";
import { getMpRosterDraft } from "../_lib/mpRosterStore.js";
import {
  saveMpFixtures,
  validateMpFixturesForPublish,
} from "../_lib/mpFixturesStore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const matches = req.body?.matches;
  if (!Array.isArray(matches)) {
    return res.status(400).json({ error: "matches array is required." });
  }

  const roster = await getMpRosterDraft();
  const check = validateMpFixturesForPublish(matches, roster.teams);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  try {
    const payload = await saveMpFixtures(matches, { publish: true });
    return res.status(200).json({ ok: true, published: true, ...payload });
  } catch (err) {
    if (err?.code === "NO_STORAGE") {
      return res.status(503).json({ error: err.message });
    }
    console.error("[admin/publish-mp-fixtures]", err);
    return res.status(500).json({ error: "Failed to publish MP fixtures" });
  }
}
