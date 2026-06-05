import { requireAdmin } from "../_lib/auth.js";
import { getMpRosterDraft } from "../_lib/mpRosterStore.js";
import {
  normalizeBracket,
  saveMpBracket,
  validateBracketForPublish,
} from "../_lib/mpBracketStore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const bracket = req.body?.bracket;
  if (!bracket || typeof bracket !== "object") {
    return res.status(400).json({ error: "bracket object is required." });
  }

  const roster = await getMpRosterDraft();
  const check = validateBracketForPublish(normalizeBracket(bracket), roster.teams);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  try {
    const payload = await saveMpBracket(normalizeBracket(bracket), { publish: true });
    return res.status(200).json({ ok: true, published: true, ...payload });
  } catch (err) {
    if (err?.code === "NO_STORAGE") {
      return res.status(503).json({ error: err.message });
    }
    console.error("[admin/publish-mp-bracket]", err);
    return res.status(500).json({ error: "Failed to publish MP bracket" });
  }
}
