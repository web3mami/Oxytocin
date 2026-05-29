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

async function writeFile(teams) {
  await fs.writeFile(DATA_FILE, JSON.stringify(teams, null, 2), "utf8");
}

/** @returns {Promise<Array<object>>} */
export async function listTeamsFromFile() {
  const teams = await readFile();
  return teams.sort(
    (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
  );
}

/** @param {object} team */
export async function addTeamToFile(team) {
  const teams = await readFile();
  const exists = teams.some(
    (t) => t.teamName.toLowerCase() === team.teamName.toLowerCase()
  );
  if (exists) {
    const err = new Error("Team name already registered");
    err.code = "DUPLICATE";
    throw err;
  }
  const entry = {
    id: crypto.randomUUID(),
    ...team,
    registeredAt: new Date().toISOString(),
  };
  teams.push(entry);
  await writeFile(teams);
  return entry;
}

export function isFileStoreAvailable() {
  return !process.env.VERCEL;
}
