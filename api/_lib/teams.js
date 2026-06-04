import { battleTeams } from "../../shared/teams.js";

/** @returns {Array<{ name: string, members: Array<object> }>} */
export function listPublicTeams() {
  return battleTeams.map((team) => ({
    name: team.name,
    members: (team.members ?? []).map((m) => ({
      ign: m.ign,
      xHandle: m.xHandle ?? null,
      role: m.role ?? null,
    })),
  }));
}

export function hasPublishedRosters() {
  return battleTeams.length > 0;
}
