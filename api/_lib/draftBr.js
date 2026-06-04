import {
  BR_DRAFT_SIZE,
  BR_PRIMARY_DUO_COUNT,
  BR_PRIMARY_LOBBY_SIZE,
  BR_RESERVE_COUNT,
  BR_SECONDARY_DUO_COUNT,
  BR_SECONDARY_LOBBY_SIZE,
} from "../../shared/brDraft.js";

export {
  BR_DRAFT_SIZE,
  BR_PRIMARY_DUO_COUNT,
  BR_PRIMARY_LOBBY_SIZE,
  BR_RESERVE_COUNT,
  BR_SECONDARY_DUO_COUNT,
  BR_SECONDARY_LOBBY_SIZE,
};

/** @param {Array<object>} array */
function shuffle(array) {
  const list = [...array];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** @param {object} player */
function toRosterMember(player, role = null) {
  return {
    ign: player.ign,
    uid: player.uid,
    xHandle: player.xHandle ?? null,
    ...(role ? { role } : {}),
  };
}

/** @param {Array<object>} players Even-length list */
function pairIntoDuos(players) {
  const duos = [];
  for (let i = 0; i < players.length; i += 2) {
    duos.push({
      members: [toRosterMember(players[i], "Captain"), toRosterMember(players[i + 1])],
    });
  }
  return duos;
}

/** @param {Array<object>} duos @param {string} squadName */
function duosToTeams(duos) {
  return duos.map((duo, duoIndex) => ({
    name: `Duo ${String(duoIndex + 1).padStart(2, "0")}`,
    members: duo.members,
  }));
}

/**
 * @param {Array<object>} brPlayers Registered players with modeBr
 * @returns {{ squads: Array<object>, reserve: Array<object>, meta: object }}
 */
export function draftBrDuos(brPlayers) {
  const count = brPlayers.length;

  if (count !== BR_DRAFT_SIZE) {
    const err = new Error(
      `BR draft requires exactly ${BR_DRAFT_SIZE} players (${BR_PRIMARY_LOBBY_SIZE} + ${BR_SECONDARY_LOBBY_SIZE} + ${BR_RESERVE_COUNT} reserve). Currently ${count} BR registrations.`
    );
    err.code = "INVALID_COUNT";
    throw err;
  }

  const shuffled = shuffle(brPlayers);
  const squad1Players = shuffled.slice(0, BR_PRIMARY_LOBBY_SIZE);
  const squad2Players = shuffled.slice(
    BR_PRIMARY_LOBBY_SIZE,
    BR_PRIMARY_LOBBY_SIZE + BR_SECONDARY_LOBBY_SIZE
  );
  const reservePlayer = shuffled[BR_PRIMARY_LOBBY_SIZE + BR_SECONDARY_LOBBY_SIZE];

  const squads = [
    {
      name: "BR Squad 1",
      lobbyNote: `${BR_PRIMARY_LOBBY_SIZE} players · ${BR_PRIMARY_DUO_COUNT} duos`,
      teams: duosToTeams(pairIntoDuos(squad1Players)),
    },
    {
      name: "BR Squad 2",
      lobbyNote: `${BR_SECONDARY_LOBBY_SIZE} players · ${BR_SECONDARY_DUO_COUNT} duos`,
      teams: duosToTeams(pairIntoDuos(squad2Players)),
    },
  ];

  return {
    squads,
    reserve: [toRosterMember(reservePlayer, "Reserve")],
    meta: {
      playerCount: count,
      duoCount: BR_PRIMARY_DUO_COUNT + BR_SECONDARY_DUO_COUNT,
      squads: squads.length,
      reserveCount: BR_RESERVE_COUNT,
    },
  };
}
