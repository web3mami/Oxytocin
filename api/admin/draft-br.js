import { requireAdmin } from "../_lib/auth.js";
import { draftBrDuos } from "../_lib/draftBr.js";
import { listPlayers } from "../_lib/players.js";

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
    const players = await listPlayers();
    const brPlayers = players.filter((p) => p.modeBr);
    const draft = draftBrDuos(brPlayers);

    return res.status(200).json({
      ok: true,
      ...draft,
    });
  } catch (err) {
    if (err?.code === "INVALID_COUNT") {
      return res.status(400).json({ error: err.message });
    }
    console.error("[admin/draft-br]", err);
    return res.status(500).json({ error: "Failed to draft BR teams" });
  }
}
