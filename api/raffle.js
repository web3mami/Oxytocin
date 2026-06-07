import { getPublishedRaffle } from "./_lib/raffleStore.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { published, raffle } = await getPublishedRaffle();
    return res.status(200).json({
      published,
      spots: raffle.spots,
      pool: raffle.pool,
      winners: raffle.winners ?? [],
      drawnAt: raffle.drawnAt ?? null,
    });
  } catch (err) {
    console.error("[raffle]", err);
    return res.status(500).json({ error: "Failed to load raffle" });
  }
}
