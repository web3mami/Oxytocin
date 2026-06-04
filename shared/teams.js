/** NATO phonetic names for drafted squads (Team Alpha … Team Zulu = 26 teams). */
export const TEAM_NAMES = [
  "Team Alpha",
  "Team Bravo",
  "Team Charlie",
  "Team Delta",
  "Team Echo",
  "Team Foxtrot",
  "Team Golf",
  "Team Hotel",
  "Team India",
  "Team Juliet",
  "Team Kilo",
  "Team Lima",
  "Team Mike",
  "Team November",
  "Team Oscar",
  "Team Papa",
  "Team Quebec",
  "Team Romeo",
  "Team Sierra",
  "Team Tango",
  "Team Uniform",
  "Team Victor",
  "Team Whiskey",
  "Team X-ray",
  "Team Yankee",
  "Team Zulu",
];

/** @param {number} index Zero-based squad index (0 = Team Alpha). */
export function getTeamName(index) {
  return TEAM_NAMES[index] ?? `Team ${index + 1}`;
}

/**
 * Published battle rosters after the organizer draft.
 * Use TEAM_NAMES / getTeamName() for squad titles. Each member `uid` must match registration.
 *
 * @example
 * {
 *   name: getTeamName(0),
 *   members: [
 *     { ign: "PlayerOne", uid: "6793344815339077633", role: "Captain" },
 *     { ign: "PlayerTwo", uid: "6893991447503568897" },
 *   ],
 * }
 */
export const battleTeams = [];
