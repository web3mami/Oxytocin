import { requireAdmin } from "../_lib/auth.js";
import { listPlayers } from "../_lib/players.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const players = await listPlayers();
    return res.status(200).json({ players, count: players.length });
  } catch (err) {
    console.error("[admin/players]", err);
    return res.status(500).json({ error: "Failed to load registrations" });
  }
}
