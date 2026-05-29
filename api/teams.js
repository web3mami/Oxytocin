import { listTeams } from "./_lib/teams.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const teams = await listTeams();
    return res.status(200).json({ teams, count: teams.length });
  } catch (err) {
    console.error("[teams]", err);
    return res.status(500).json({ error: "Failed to load teams" });
  }
}
