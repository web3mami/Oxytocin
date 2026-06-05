import { requireAdmin } from "../_lib/auth.js";
import { getMpRosterDraft } from "../_lib/mpRosterStore.js";
import { generateAndSaveMpBracket } from "../_lib/mpBracketStore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const roster = await getMpRosterDraft();
    const teamNames = (roster.teams ?? []).map((t) => t.name).filter(Boolean);
    if (!teamNames.length) {
      return res.status(400).json({ error: "Save MP teams before generating the cup bracket." });
    }

    const payload = await generateAndSaveMpBracket(teamNames);
    return res.status(200).json({ ok: true, ...payload });
  } catch (err) {
    if (err?.code === "NO_STORAGE") {
      return res.status(503).json({ error: err.message });
    }
    console.error("[admin/generate-mp-bracket]", err);
    return res.status(500).json({ error: "Failed to generate MP bracket" });
  }
}
