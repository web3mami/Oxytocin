import { registerPlayer } from "./_lib/players.js";
import { validateRegistration } from "./_lib/validate.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = validateRegistration(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const player = await registerPlayer(parsed.data);
    return res.status(201).json({ player });
  } catch (err) {
    if (err?.code === "DUPLICATE") {
      return res.status(409).json({ error: err.message });
    }
    if (err?.code === "FULL") {
      return res.status(409).json({ error: err.message });
    }
    if (err?.code === "NO_STORAGE") {
      return res.status(503).json({ error: err.message });
    }
    console.error("[register]", err);
    return res.status(500).json({ error: "Registration failed" });
  }
}
