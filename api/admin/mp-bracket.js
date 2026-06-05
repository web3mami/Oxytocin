import { requireAdmin } from "../_lib/auth.js";
import { getMpBracketDraft, saveMpBracket } from "../_lib/mpBracketStore.js";
import { normalizeBracket } from "../../shared/mpBracket.js";

export default async function handler(req, res) {
  const auth = requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === "GET") {
    try {
      const draft = await getMpBracketDraft();
      return res.status(200).json({ ok: true, bracket: draft, published: draft.published, updatedAt: draft.updatedAt });
    } catch (err) {
      console.error("[admin/mp-bracket GET]", err);
      return res.status(500).json({ error: "Failed to load MP bracket" });
    }
  }

  if (req.method === "PUT") {
    const bracket = req.body?.bracket;
    if (!bracket || typeof bracket !== "object") {
      return res.status(400).json({ error: "bracket object is required." });
    }
    try {
      const payload = await saveMpBracket(normalizeBracket(bracket), { publish: false });
      return res.status(200).json({ ok: true, ...payload });
    } catch (err) {
      if (err?.code === "NO_STORAGE") {
        return res.status(503).json({ error: err.message });
      }
      console.error("[admin/mp-bracket PUT]", err);
      return res.status(500).json({ error: "Failed to save MP bracket" });
    }
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
