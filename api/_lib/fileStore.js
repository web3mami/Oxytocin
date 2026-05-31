import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "../../data/registrations.json");

async function readFile() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeFile(players) {
  await fs.writeFile(DATA_FILE, JSON.stringify(players, null, 2), "utf8");
}

/** @returns {Promise<Array<object>>} */
export async function listPlayersFromFile() {
  const players = await readFile();
  return players.sort(
    (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
  );
}

/** @param {object} player */
export async function addPlayerToFile(player) {
  const players = await readFile();
  const duplicate = players.find(
    (p) =>
      p.uid === player.uid ||
      p.ign.toLowerCase() === player.ign.toLowerCase()
  );
  if (duplicate) {
    const err = new Error("This player is already registered");
    err.code = "DUPLICATE";
    throw err;
  }
  const entry = {
    id: crypto.randomUUID(),
    ...player,
    registeredAt: new Date().toISOString(),
  };
  players.push(entry);
  await writeFile(players);
  return entry;
}

export function isFileStoreAvailable() {
  return !process.env.VERCEL;
}
