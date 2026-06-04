/** Main BR lobby — 40 players, 20 duos. */
export const BR_PRIMARY_LOBBY_SIZE = 40;
export const BR_PRIMARY_DUO_COUNT = 20;

/** Second BR lobby — 20 players, 10 duos. */
export const BR_SECONDARY_LOBBY_SIZE = 20;
export const BR_SECONDARY_DUO_COUNT = 10;

/** Extra player if a duo member is unavailable. */
export const BR_RESERVE_COUNT = 1;

export const BR_DRAFT_SIZE =
  BR_PRIMARY_LOBBY_SIZE + BR_SECONDARY_LOBBY_SIZE + BR_RESERVE_COUNT;
