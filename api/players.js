import { listPlayers } from "./_lib/players.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const players = await listPlayers();
    return res.status(200).json({ count: players.length });
  } catch (err) {
    console.error("[players]", err);
    return res.status(500).json({ error: "Failed to load players" });
  }
}
