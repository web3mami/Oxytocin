import { requireAdmin } from "../_lib/auth.js";
import { deletePlayer, listPlayers } from "../_lib/players.js";

export default async function handler(req, res) {
  const auth = requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === "GET") {
    try {
      const players = await listPlayers();
      return res.status(200).json({ players, count: players.length });
    } catch (err) {
      console.error("[admin/players GET]", err);
      return res.status(500).json({ error: "Failed to load registrations" });
    }
  }

  if (req.method === "DELETE") {
    const id = req.query?.id ?? req.body?.id;
    try {
      const result = await deletePlayer(id);
      return res.status(200).json({ ok: true, id: result.id });
    } catch (err) {
      if (err?.code === "NOT_FOUND") {
        return res.status(404).json({ error: err.message });
      }
      if (err?.code === "INVALID") {
        return res.status(400).json({ error: err.message });
      }
      if (err?.code === "NO_STORAGE") {
        return res.status(503).json({ error: err.message });
      }
      console.error("[admin/players DELETE]", err);
      return res.status(500).json({ error: "Failed to delete registration" });
    }
  }

  res.setHeader("Allow", "GET, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
