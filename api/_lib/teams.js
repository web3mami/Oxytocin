import { getPublishedMpBracket } from "./mpBracketStore.js";

import { getPublishedMpFixtures } from "./mpFixturesStore.js";

import { getPublishedMpRoster } from "./mpRosterStore.js";

import { getPublishedRoster } from "./rosterStore.js";

import { bracketFromDraw } from "../../shared/mpBracket.js";



/** @returns {Promise<object>} */

export async function listPublicRoster() {

  const [br, mp, mpFixtures, mpBracket] = await Promise.all([

    getPublishedRoster(),

    getPublishedMpRoster(),

    getPublishedMpFixtures(),

    getPublishedMpBracket(),

  ]);



  let bracket = { bracketSize: 0, rounds: [] };

  let bracketPublished = false;



  if (mpBracket.published && mpBracket.bracket?.rounds?.length) {

    bracket = mpBracket.bracket;

    bracketPublished = true;

  } else if (mpFixtures.published && mpFixtures.matches?.length && mp.published) {

    bracket = bracketFromDraw(

      mpFixtures.matches,

      (mp.teams ?? []).map((t) => t.name)

    );

    bracketPublished = (bracket.rounds?.length ?? 0) > 0;

  }



  return {

    published: br.published,

    squads: br.squads,

    teams: br.teams,

    reserve: br.reserve ?? [],

    mpPublished: mp.published,

    mpTeams: mp.teams,

    mpFixturesPublished: mpFixtures.published,

    mpMatches: mpFixtures.matches,

    mpBracketPublished: bracketPublished,

    mpBracket: bracket,

  };

}



/** @deprecated */

export function hasPublishedRosters() {

  return false;

}

