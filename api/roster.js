import { listPublicRoster } from "./_lib/teams.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const roster = await listPublicRoster();
    return res.status(200).json(roster);
  } catch (err) {
    console.error("[roster]", err);
    return res.status(500).json({ error: "Failed to load rosters" });
  }
}
