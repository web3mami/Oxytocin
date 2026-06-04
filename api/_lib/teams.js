import { getPublishedRoster } from "./rosterStore.js";

/** @returns {Promise<{ published: boolean, squads: Array<object>, teams: Array<object>, reserve: Array<object> }>} */
export async function listPublicRoster() {
  const roster = await getPublishedRoster();
  return {
    published: roster.published,
    squads: roster.squads,
    teams: roster.teams,
    reserve: roster.reserve ?? [],
  };
}

/** @deprecated */
export function hasPublishedRosters() {
  return false;
}
