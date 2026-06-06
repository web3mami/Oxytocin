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
