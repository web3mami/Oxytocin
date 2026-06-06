/** Max reserve slots when the reserve player is paired with a late add. */
export const BR_RESERVE_DUO_SIZE = 2;

/**
 * @param {{ squads?: Array<object>, reserve?: Array<object> }} roster
 * @returns {Set<string>}
 */
export function rosterAssignedIgns(roster) {
  /** @type {Set<string>} */
  const igns = new Set();
  for (const squad of roster?.squads ?? []) {
    for (const team of squad.teams ?? []) {
      for (const member of team.members ?? []) {
        if (member?.ign) igns.add(member.ign.toLowerCase());
      }
    }
  }
  for (const member of roster?.reserve ?? []) {
    if (member?.ign) igns.add(member.ign.toLowerCase());
  }
  return igns;
}

/**
 * @param {Array<object>} brPlayers
 * @param {{ squads?: Array<object>, reserve?: Array<object> }} roster
 */
export function findUnassignedBrPlayers(brPlayers, roster) {
  const assigned = rosterAssignedIgns(roster);
  return brPlayers.filter((player) => !assigned.has(player.ign.toLowerCase()));
}

/** @param {object} player */
export function toBrRosterMember(player, role = null) {
  return {
    ign: player.ign,
    uid: player.uid ?? null,
    xHandle: player.xHandle ?? null,
    ...(role ? { role } : {}),
  };
}

/**
 * @param {{ squads?: Array<object>, reserve?: Array<object>, meta?: object }} roster
 * @param {object} player
 */
export function pairBrPlayerWithReserve(roster, player) {
  const reserve = [...(roster.reserve ?? [])];
  if (reserve.length >= BR_RESERVE_DUO_SIZE) {
    const err = new Error("Reserve already has a full pair. Remove someone first.");
    err.code = "RESERVE_FULL";
    throw err;
  }
  if (rosterAssignedIgns(roster).has(player.ign.toLowerCase())) {
    const err = new Error(`${player.ign} is already on the BR roster.`);
    err.code = "ALREADY_ASSIGNED";
    throw err;
  }

  const nextReserve = [...reserve, toBrRosterMember(player)];
  if (nextReserve.length === BR_RESERVE_DUO_SIZE) {
    if (!nextReserve[0].role) nextReserve[0] = { ...nextReserve[0], role: "Reserve" };
    nextReserve[1] = { ...nextReserve[1], role: "Partner" };
  } else if (nextReserve.length === 1 && !nextReserve[0].role) {
    nextReserve[0] = { ...nextReserve[0], role: "Reserve" };
  }

  return {
    ...roster,
    reserve: nextReserve,
    meta: {
      ...(roster.meta ?? {}),
      reserveCount: nextReserve.length,
      reserveDuo: nextReserve.length === BR_RESERVE_DUO_SIZE,
    },
  };
}

/**
 * @param {{ reserve?: Array<object> }} roster
 */
export function canPairWithReserve(roster) {
  return (roster?.reserve?.length ?? 0) < BR_RESERVE_DUO_SIZE;
}

export const BR_SQUAD_2_NAME = "BR Squad 2";

/**
 * @param {{ reserve?: Array<object> }} roster
 */
export function canPromoteReserveDuo(roster) {
  return (roster?.reserve?.length ?? 0) >= BR_RESERVE_DUO_SIZE;
}

/**
 * Move the reserve duo into BR Squad 2 as the next numbered duo and clear reserve.
 * @param {{ squads?: Array<object>, reserve?: Array<object>, meta?: object }} roster
 * @param {string} [squadName]
 */
export function promoteReserveDuoToSquad(roster, squadName = BR_SQUAD_2_NAME) {
  const reserve = [...(roster.reserve ?? [])];
  if (reserve.length < BR_RESERVE_DUO_SIZE) {
    const err = new Error("Need a full reserve duo (2 players) to add to a squad.");
    err.code = "RESERVE_INCOMPLETE";
    throw err;
  }

  let squadFound = false;
  const squads = (roster.squads ?? []).map((squad) => {
    if (squad.name !== squadName) return squad;

    squadFound = true;
    const teams = [...(squad.teams ?? [])];
    const duoNum = teams.length + 1;
    const members = reserve.slice(0, BR_RESERVE_DUO_SIZE).map((member) => ({
      ign: member.ign,
      uid: member.uid ?? null,
      xHandle: member.xHandle ?? null,
    }));

    teams.push({
      name: `Duo ${String(duoNum).padStart(2, "0")}`,
      members,
    });

    const playerCount = teams.reduce(
      (sum, team) => sum + (team.members?.length ?? 0),
      0
    );

    return {
      ...squad,
      lobbyNote: `${playerCount} players · ${teams.length} duos`,
      teams,
    };
  });

  if (!squadFound) {
    const err = new Error(`${squadName} not found on this roster.`);
    err.code = "SQUAD_NOT_FOUND";
    throw err;
  }

  return {
    ...roster,
    squads,
    reserve: [],
    meta: {
      ...(roster.meta ?? {}),
      reserveCount: 0,
      reserveDuo: false,
    },
  };
}
