import {
  BR_DRAFT_SIZE,
  BR_DUOS_PER_SQUAD,
  BR_LOBBY_CAPACITY,
  BR_SQUAD_COUNT,
} from "../../shared/brDraft.js";

export { BR_DRAFT_SIZE, BR_DUOS_PER_SQUAD, BR_LOBBY_CAPACITY, BR_SQUAD_COUNT };

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

/**
 * @param {Array<object>} brPlayers Registered players with modeBr
 * @returns {{ squads: Array<object>, meta: object }}
 */
export function draftBrDuos(brPlayers) {
  const count = brPlayers.length;

  if (count !== BR_DRAFT_SIZE) {
    const err = new Error(
      `BR draft requires exactly ${BR_DRAFT_SIZE} players (2 lobbies × ${BR_LOBBY_CAPACITY}). Currently ${count} BR registrations.`
    );
    err.code = "INVALID_COUNT";
    throw err;
  }

  if (count % 2 !== 0) {
    const err = new Error("BR draft requires an even number of players for duos.");
    err.code = "INVALID_COUNT";
    throw err;
  }

  const shuffled = shuffle(brPlayers);
  const duos = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    duos.push({
      members: [toRosterMember(shuffled[i], "Captain"), toRosterMember(shuffled[i + 1])],
    });
  }

  const squads = [];

  for (let squadIndex = 0; squadIndex < BR_SQUAD_COUNT; squadIndex += 1) {
    const start = squadIndex * BR_DUOS_PER_SQUAD;
    const squadDuos = duos.slice(start, start + BR_DUOS_PER_SQUAD);

    squads.push({
      name: `BR Squad ${squadIndex + 1}`,
      lobbyNote: `${BR_LOBBY_CAPACITY} players · ${BR_DUOS_PER_SQUAD} duos`,
      teams: squadDuos.map((duo, duoIndex) => ({
        name: `Duo ${String(duoIndex + 1).padStart(2, "0")}`,
        members: duo.members,
      })),
    });
  }

  return {
    squads,
    meta: {
      playerCount: count,
      duoCount: duos.length,
      squads: BR_SQUAD_COUNT,
      duosPerSquad: BR_DUOS_PER_SQUAD,
    },
  };
}
