/**
 * One-off / manual MP registration. Requires DATABASE_URL in env.
 * Usage: node --env-file=.env.local scripts/add-mp-player.mjs
 */
import { registerPlayer } from "../api/_lib/players.js";

const player = {
  ign: "miTSUKI",
  uid: "7032635197972217857",
  xHandle: "denzycrypt",
  modeMp: true,
  modeBr: false,
};

try {
  const result = await registerPlayer(player);
  console.log("Added MP registration:", result);
} catch (err) {
  if (err?.code === "DUPLICATE") {
    console.error("Player already registered:", err.message);
    process.exit(1);
  }
  console.error("Failed:", err.message);
  process.exit(1);
}
