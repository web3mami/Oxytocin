import { randomInt } from "node:crypto";
import { requireAdmin } from "../_lib/auth.js";
import {
  getRaffleDraft,
  normalizeRaffle,
  pickWinners,
  saveRaffle,
  validateRaffleForDraw,
} from "../_lib/raffleStore.js";

/**
 * Flat raffle admin endpoint. Uses a single path with ?op= for actions so it
 * routes reliably as a standalone function (the nested /api/admin/mp/[[...path]]
 * catch-all does not route deep sub-paths on this deployment).
 *   GET    /api/admin/raffle            -> load draft
 *   PUT    /api/admin/raffle            -> save pool draft { spots, pool }
 *   POST   /api/admin/raffle?op=draw    -> run draw + publish { spots, pool }
 *   POST   /api/admin/raffle?op=clear   -> clear winners / unpublish
 */
export default async function handler(req, res) {
  const auth = requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const body = req.body ?? {};
  const op = String(req.query?.op ?? "");

  try {
    if (req.method === "GET") {
      const draft = await getRaffleDraft();
      return res.status(200).json({ ok: true, ...draft });
    }

    if (req.method === "PUT") {
      const payload = await saveRaffle(
        { spots: body.spots, pool: body.pool, winners: null, drawnAt: null },
        { publish: false }
      );
      return res.status(200).json({ ok: true, ...payload });
    }

    if (req.method === "POST" && op === "draw") {
      const incoming = normalizeRaffle({ spots: body.spots, pool: body.pool });
      const check = validateRaffleForDraw(incoming);
      if (!check.ok) {
        return res.status(400).json({ error: check.error });
      }
      const winners = pickWinners(incoming.pool, incoming.spots, (n) => randomInt(n));
      const payload = await saveRaffle(
        {
          spots: incoming.spots,
          pool: incoming.pool,
          winners,
          drawnAt: new Date().toISOString(),
        },
        { publish: true }
      );
      return res.status(200).json({ ok: true, published: true, ...payload });
    }

    if (req.method === "POST" && op === "clear") {
      const existing = await getRaffleDraft();
      const payload = await saveRaffle(
        { spots: existing.spots, pool: existing.pool, winners: null, drawnAt: null },
        { publish: false }
      );
      return res.status(200).json({ ok: true, ...payload });
    }

    res.setHeader("Allow", "GET, PUT, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    if (err?.code === "NO_STORAGE") {
      return res.status(503).json({ error: err.message });
    }
    console.error("[admin/raffle]", err);
    return res
      .status(500)
      .json({ error: `Raffle ${op || req.method} failed: ${err?.message || "unknown error"}` });
  }
}
