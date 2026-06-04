import { hasPublishedRosters, listPublicTeams } from "./_lib/teams.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!hasPublishedRosters()) {
    return res.status(200).json({
      published: false,
      teams: [],
    });
  }

  return res.status(200).json({
    published: true,
    teams: listPublicTeams(),
  });
}
